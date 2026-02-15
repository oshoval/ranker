// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

/**
 * @jest-environment node
 */

import type { GitHubPR } from '@/shared/types';
import { handleGetPRs } from '@/features/ranker/api/prs';
import { getGitHubClient } from '@/shared/github/client';
import { prCache } from '@/shared/utils/cache';
import '@/shared/storage/logs';

jest.mock('@/shared/github/client');
jest.mock('@/shared/utils/cache');
jest.mock('@/shared/storage/logs');

function createRequest(
  url: string,
  options?: { clientId?: number; realIp?: string }
): Request {
  const headers: Record<string, string> = {};
  if (options?.clientId !== undefined) {
    headers['x-forwarded-for'] = `192.168.1.${options.clientId}`;
  }
  if (options?.realIp) {
    headers['x-real-ip'] = options.realIp;
  }
  return new Request(url, { headers });
}

function makePR(overrides: Partial<GitHubPR> = {}): GitHubPR {
  return {
    number: 1,
    title: 'Test PR',
    body: '',
    author: 'test',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    isDraft: false,
    mergeable: 'MERGEABLE',
    headRefName: 'feat/test',
    baseRefName: 'main',
    additions: 10,
    deletions: 5,
    changedFiles: 1,
    labels: [],
    reviews: [],
    files: [
      {
        path: 'src/app.ts',
        additions: 10,
        deletions: 5,
        changeType: 'modified',
      },
    ],
    reviewRequests: [],
    ...overrides,
  };
}

describe('handleGetPRs', () => {
  const mockFetchOpenPRs = jest.fn();
  const mockGet = jest.mocked(prCache.get);
  const _mockSet = jest.mocked(prCache.set);

  beforeEach(() => {
    jest.clearAllMocks();
    (getGitHubClient as jest.Mock).mockReturnValue({
      fetchOpenPRs: mockFetchOpenPRs,
    });
    mockGet.mockReturnValue(undefined);
  });

  it('returns 400 when owner is missing', async () => {
    const req = createRequest('http://localhost:3000/api/prs?repo=validrepo', {
      clientId: 1,
    });
    const response = await handleGetPRs(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Invalid owner or repo format' });
  });

  it('returns 400 when repo has invalid characters', async () => {
    const req = createRequest(
      'http://localhost:3000/api/prs?owner=test&repo=repo!invalid',
      { clientId: 2 }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Invalid owner or repo format' });
  });

  it('returns 401 when GitHub token is missing', async () => {
    mockFetchOpenPRs.mockRejectedValue(
      new Error('GITHUB_TOKEN environment variable is required')
    );
    const req = createRequest(
      'http://localhost:3000/api/prs?owner=test&repo=repo',
      { clientId: 3 }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Authentication required' });
  });

  it('returns 429 when rate limited', async () => {
    mockFetchOpenPRs.mockRejectedValue(new Error('RATE_LIMITED'));
    const req = createRequest(
      'http://localhost:3000/api/prs?owner=test&repo=repo',
      { clientId: 4 }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({ error: 'GitHub rate limit exceeded' });
  });

  it('returns 404 when repo not found', async () => {
    mockFetchOpenPRs.mockRejectedValue(new Error('REPOSITORY_NOT_FOUND'));
    const req = createRequest(
      'http://localhost:3000/api/prs?owner=test&repo=nonexistent',
      { clientId: 5 }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Repository not found' });
  });

  it('returns 500 on unexpected error with no internal details', async () => {
    mockFetchOpenPRs.mockRejectedValue(new Error('Something went wrong'));
    const req = createRequest(
      'http://localhost:3000/api/prs?owner=test&repo=repo',
      { clientId: 6 }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Internal server error' });
  });

  it('returns 200 with scored and filtered PRs on success', async () => {
    const prs = [makePR({ number: 1 }), makePR({ number: 2 })];
    mockFetchOpenPRs.mockResolvedValue(prs);
    const req = createRequest(
      'http://localhost:3000/api/prs?owner=test&repo=repo',
      { clientId: 7 }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('prs');
    expect(body).toHaveProperty('total', 2);
    expect(body).toHaveProperty('filtered');
    expect(body).toHaveProperty('owner', 'test');
    expect(body).toHaveProperty('repo', 'repo');
    expect(body).toHaveProperty('fetchedAt');
    expect(Array.isArray(body.prs)).toBe(true);
    expect(body.prs.length).toBeLessThanOrEqual(2);
    body.prs.forEach((pr: { score: number; scoreBreakdown: unknown }) => {
      expect(pr).toHaveProperty('score');
      expect(pr).toHaveProperty('scoreBreakdown');
    });
  });

  it('uses cache when available', async () => {
    const cachedPRs = [makePR({ number: 99 })];
    mockGet.mockReturnValue(cachedPRs as unknown);
    const req = createRequest(
      'http://localhost:3000/api/prs?owner=test&repo=repo',
      { clientId: 8 }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(200);
    expect(mockFetchOpenPRs).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.total).toBe(1);
    expect(body.owner).toBe('test');
    expect(body.repo).toBe('repo');
  });

  it('returns 429 when API rate limit exceeded', async () => {
    const cachedPRs = [makePR({ number: 1 })];
    mockGet.mockReturnValue(cachedPRs as unknown);
    const url = 'http://localhost:3000/api/prs?owner=test&repo=repo';
    const clientId = 90;
    for (let i = 0; i < 10; i++) {
      const req = createRequest(url, { clientId });
      const res = await handleGetPRs(req);
      expect(res.status).toBe(200);
    }
    const req = createRequest(url, { clientId });
    const res = await handleGetPRs(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ error: 'Too many requests' });
  });

  it('uses x-real-ip when x-forwarded-for is absent', async () => {
    const prs = [makePR({ number: 1 })];
    mockFetchOpenPRs.mockResolvedValue(prs);
    const req = new Request(
      'http://localhost:3000/api/prs?owner=test&repo=repo',
      {
        headers: { 'x-real-ip': '10.0.0.5' },
      }
    );
    const response = await handleGetPRs(req);
    expect(response.status).toBe(200);
  });
});
