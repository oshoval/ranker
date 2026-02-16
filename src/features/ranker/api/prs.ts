// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { GitHubPR } from '@/shared/types';
import type { FilteredPR, PRsResponse } from '../types';
import { getGitHubClient } from '@/shared/github/client';
import { prCache } from '@/shared/utils/cache';
import { logProductError, logUserError } from '@/shared/storage/logs';
import { DEFAULT_FILTER_CONFIG, type FilterConfig } from '../lib/filter-config';
import { filterPRs } from '../lib/filters';
import { scoringEngine } from '../lib/scoring/engine';

const OWNER_REPO_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
const MAX_OWNER_REPO_LEN = 256;
const DEFAULT_LIMIT = 50;
const MIN_LIMIT = 1;
const MAX_LIMIT = 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const MAX_LABELS = 50;
const MAX_LABELS_LENGTH = 2048;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim() ?? 'unknown';
    return ip.slice(0, 45);
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.slice(0, 45);
  return 'unknown';
}

const GLOBAL_RATE_LIMIT_MAX = 200;
let globalRequestCount = 0;
let globalResetAt = Date.now() + RATE_LIMIT_WINDOW_MS;

function checkGlobalRateLimit(): boolean {
  const now = Date.now();
  if (now >= globalResetAt) {
    globalRequestCount = 0;
    globalResetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  globalRequestCount++;
  return globalRequestCount <= GLOBAL_RATE_LIMIT_MAX;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry) {
    rateLimitMap.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (now >= entry.resetAt) {
    rateLimitMap.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function parseBool(val: string | null): boolean {
  if (!val) return false;
  const v = val.toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseLabels(val: string | null): string[] {
  if (!val || !val.trim()) return [];
  if (val.length > MAX_LABELS_LENGTH) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_LABELS);
}

function parseFilterConfig(searchParams: URLSearchParams): FilterConfig {
  const holdLabels = parseLabels(searchParams.get('holdLabels'));
  const skipLabels = parseLabels(searchParams.get('skipLabels'));

  const getBool = (key: string, def: boolean) =>
    searchParams.has(key) ? parseBool(searchParams.get(key)) : def;

  return {
    holdLabels:
      holdLabels.length > 0 ? holdLabels : DEFAULT_FILTER_CONFIG.holdLabels,
    skipLabels:
      skipLabels.length > 0 ? skipLabels : DEFAULT_FILTER_CONFIG.skipLabels,
    excludeDrafts: getBool(
      'excludeDrafts',
      DEFAULT_FILTER_CONFIG.excludeDrafts
    ),
    excludeApproved: getBool(
      'excludeApproved',
      DEFAULT_FILTER_CONFIG.excludeApproved
    ),
    excludeHold: getBool('excludeHold', DEFAULT_FILTER_CONFIG.excludeHold),
    excludeConflicts: getBool(
      'excludeConflicts',
      DEFAULT_FILTER_CONFIG.excludeConflicts
    ),
    excludeActiveReviews: getBool(
      'excludeActiveReviews',
      DEFAULT_FILTER_CONFIG.excludeActiveReviews
    ),
    excludeSkipReview: getBool(
      'excludeSkipReview',
      DEFAULT_FILTER_CONFIG.excludeSkipReview
    ),
  };
}

function validateOwnerRepo(owner: string, repo: string): string | null {
  if (!OWNER_REPO_PATTERN.test(owner) || !OWNER_REPO_PATTERN.test(repo)) {
    return 'Invalid owner or repo format';
  }
  if (owner.length + repo.length > MAX_OWNER_REPO_LEN) {
    return 'Owner and repo combined exceed max length';
  }
  return null;
}

function parseLimit(val: string | null): number {
  const n = parseInt(val ?? '', 10);
  if (Number.isNaN(n)) return DEFAULT_LIMIT;
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, n));
}

export async function handleGetPRs(request: Request): Promise<Response> {
  if (!checkGlobalRateLimit()) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientId = getClientId(request);

  if (!checkRateLimit(clientId)) {
    logUserError(
      'Rate limit exceeded',
      JSON.stringify({ clientId }),
      'prs-api'
    );
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner') ?? '';
  const repo = searchParams.get('repo') ?? '';

  const validationError = validateOwnerRepo(owner, repo);
  if (validationError) {
    return new Response(JSON.stringify({ error: validationError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = parseLimit(searchParams.get('limit'));

  let prs: GitHubPR[];

  const cacheKey = `prs:${owner}:${repo}:${limit}`;
  const cached = prCache.get(cacheKey) as GitHubPR[] | undefined;

  if (cached) {
    prs = cached;
  } else {
    try {
      const client = getGitHubClient();
      prs = await client.fetchOpenPRs(owner, repo, limit);
      prCache.set(cacheKey, prs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg === 'GITHUB_TOKEN environment variable is required') {
        logUserError('Missing GitHub token', msg, 'prs-api');
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (msg === 'RATE_LIMITED') {
        return new Response(
          JSON.stringify({ error: 'GitHub rate limit exceeded' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (msg === 'REPOSITORY_NOT_FOUND') {
        return new Response(JSON.stringify({ error: 'Repository not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      logProductError(`PR fetch failed: ${msg}`, String(err), 'prs-api');
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const criteria = parseFilterConfig(searchParams);
  const { passed } = filterPRs(prs, criteria);

  const scored = scoringEngine.scorePRs(passed) as FilteredPR[];

  const response: PRsResponse = {
    prs: scored,
    total: prs.length,
    filtered: prs.length - passed.length,
    owner,
    repo,
    fetchedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
