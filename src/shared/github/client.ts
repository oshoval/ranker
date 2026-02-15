// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { GitHubPR, PRFile, PRLabel, PRReview } from '@/shared/types';
import { logProductError, logUserError } from '@/shared/storage/logs';
import { logger } from '@/shared/utils/logger';
import {
  GET_PRS_QUERY,
  GET_SINGLE_PR_QUERY,
  type GraphQLPRNode,
  type GraphQLPRResponse,
  type GraphQLSinglePRResponse,
} from './types';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const GITHUB_REST_BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 30_000; // [PT-Infra-01]
const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [502, 503, 504];

function mapGraphQLNodeToGitHubPR(node: GraphQLPRNode): GitHubPR {
  const filesNodes = node.files?.nodes ?? [];
  const files: PRFile[] = filesNodes
    .filter((n): n is NonNullable<typeof n> => n != null)
    .map((f) => ({
      path: f.path,
      additions: f.additions,
      deletions: f.deletions,
      changeType: 'modified' as const,
    }));

  const reviews: PRReview[] = (node.reviews.nodes ?? [])
    .filter((n): n is NonNullable<typeof n> => n != null)
    .map((r) => ({
      author: r.author?.login ?? '',
      state: r.state,
      submittedAt: r.submittedAt ?? '',
    }));

  const labels: PRLabel[] = (node.labels.nodes ?? [])
    .filter((n): n is NonNullable<typeof n> => n != null)
    .map((l) => ({ name: l.name, color: l.color }));

  const reviewRequests = (node.reviewRequests.nodes ?? [])
    .map((r) => r?.requestedReviewer?.login)
    .filter(
      (login): login is string => typeof login === 'string' && login !== ''
    );

  return {
    number: node.number,
    title: node.title,
    body: node.body ?? '',
    author: node.author?.login ?? '',
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    isDraft: node.isDraft,
    mergeable: node.mergeable,
    headRefName: node.headRefName,
    baseRefName: node.baseRefName,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    labels,
    reviews,
    files,
    reviewRequests,
  };
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GitHubClient {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    url: string,
    options: RequestInit & { body?: string }
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      try {
        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          const message = body.message ?? 'GitHub API returned 403';
          const isRateLimit =
            message.toLowerCase().includes('rate') ||
            res.headers.get('X-RateLimit-Remaining') === '0';
          if (isRateLimit) {
            logUserError(
              'GitHub rate limit exceeded',
              JSON.stringify({ status: res.status, message }),
              'github-client'
            );
            throw new Error('RATE_LIMITED');
          }
        }

        if (res.status === 404) {
          logUserError(
            'Repository not found',
            JSON.stringify({ status: res.status, url }),
            'github-client'
          );
          throw new Error('REPOSITORY_NOT_FOUND');
        }

        if (
          RETRYABLE_STATUS_CODES.includes(res.status) &&
          attempt < MAX_RETRIES - 1
        ) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          logger.warn(
            `GitHub API ${res.status}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await delay(backoffMs);
          continue;
        }

        return (await res.json()) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        clearTimeout(timeoutId);

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            logProductError(
              'GitHub request timeout',
              err.stack ?? err.message,
              'github-client'
            );
            throw err;
          }
          if (
            err.message === 'RATE_LIMITED' ||
            err.message === 'REPOSITORY_NOT_FOUND'
          ) {
            throw err;
          }
        }

        if (attempt < MAX_RETRIES - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          logger.warn(
            `GitHub request failed: ${lastError?.message}, retrying in ${backoffMs}ms`
          );
          await delay(backoffMs);
        } else {
          logProductError(
            `GitHub request failed: ${lastError?.message}`,
            lastError?.stack ?? '',
            'github-client'
          );
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error('GitHub request failed');
  }

  async fetchOpenPRs(
    owner: string,
    repo: string,
    limit = 100
  ): Promise<GitHubPR[]> {
    const allPRs: GitHubPR[] = [];
    let cursor: string | null = null;

    do {
      const response: GraphQLPRResponse = await this.request<GraphQLPRResponse>(
        GITHUB_GRAPHQL_URL,
        {
          method: 'POST',
          body: JSON.stringify({
            query: GET_PRS_QUERY,
            variables: { owner, repo, cursor },
          }),
        }
      );

      if (response.errors?.length) {
        const msg = response.errors.map((e) => e.message).join('; ');
        if (
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('could not resolve')
        ) {
          logUserError('Repository not found', msg, 'github-client');
          throw new Error('REPOSITORY_NOT_FOUND');
        }
        logProductError(
          `GraphQL errors: ${msg}`,
          JSON.stringify(response.errors),
          'github-client'
        );
        throw new Error(msg);
      }

      const repository = response.data?.repository;
      if (!repository) {
        break;
      }

      const { nodes, pageInfo } = repository.pullRequests;
      const prs = (nodes ?? [])
        .filter(
          (n: GraphQLPRNode | null | undefined): n is GraphQLPRNode => n != null
        )
        .map(mapGraphQLNodeToGitHubPR);
      allPRs.push(...prs);

      if (allPRs.length >= limit || !pageInfo.hasNextPage) {
        break;
      }
      cursor = pageInfo.endCursor;
    } while (cursor);

    return allPRs.slice(0, limit);
  }

  async fetchSinglePR(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<GitHubPR | null> {
    const response = await this.request<GraphQLSinglePRResponse>(
      GITHUB_GRAPHQL_URL,
      {
        method: 'POST',
        body: JSON.stringify({
          query: GET_SINGLE_PR_QUERY,
          variables: { owner, repo, number: prNumber },
        }),
      }
    );

    if (response.errors?.length) {
      const msg = response.errors.map((e) => e.message).join('; ');
      if (
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('could not resolve')
      ) {
        logUserError('Repository not found', msg, 'github-client');
        throw new Error('REPOSITORY_NOT_FOUND');
      }
      logProductError(
        `GraphQL errors: ${msg}`,
        JSON.stringify(response.errors),
        'github-client'
      );
      throw new Error(msg);
    }

    const pr = response.data?.repository?.pullRequest;
    return pr ? mapGraphQLNodeToGitHubPR(pr) : null;
  }

  async fetchPRDiff(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<string> {
    const url = `${GITHUB_REST_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      try {
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.diff',
            'Content-Type': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          const message = body.message ?? 'GitHub API returned 403';
          if (
            message.toLowerCase().includes('rate') ||
            res.headers.get('X-RateLimit-Remaining') === '0'
          ) {
            logUserError(
              'GitHub rate limit exceeded',
              JSON.stringify({ status: res.status, message }),
              'github-client'
            );
            throw new Error('RATE_LIMITED');
          }
        }

        if (res.status === 404) {
          logUserError(
            'Repository not found',
            JSON.stringify({ status: res.status, url }),
            'github-client'
          );
          throw new Error('REPOSITORY_NOT_FOUND');
        }

        if (
          RETRYABLE_STATUS_CODES.includes(res.status) &&
          attempt < MAX_RETRIES - 1
        ) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          logger.warn(
            `GitHub REST ${res.status}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await delay(backoffMs);
          continue;
        }

        if (!res.ok) {
          const text = await res.text();
          logProductError(
            `GitHub REST error ${res.status}: ${text}`,
            url,
            'github-client'
          );
          throw new Error(`GitHub API error: ${res.status}`);
        }

        return await res.text();
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            logProductError(
              'GitHub request timeout',
              err.stack ?? err.message,
              'github-client'
            );
            throw err;
          }
          if (
            err.message === 'RATE_LIMITED' ||
            err.message === 'REPOSITORY_NOT_FOUND'
          ) {
            throw err;
          }
        }

        if (attempt < MAX_RETRIES - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          logger.warn(
            `GitHub REST failed: ${lastError?.message}, retrying in ${backoffMs}ms`
          );
          await delay(backoffMs);
        } else {
          logProductError(
            `GitHub request failed: ${lastError?.message}`,
            lastError?.stack ?? '',
            'github-client'
          );
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error('GitHub request failed');
  }
}

let clientInstance: GitHubClient | null = null;

export function getGitHubClient(): GitHubClient {
  if (!clientInstance) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    clientInstance = new GitHubClient(token);
  }
  return clientInstance;
}
