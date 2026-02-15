// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePRs } from '@/features/ranker/hooks/use-prs';
import { DEFAULT_FILTER_CONFIG } from '@/features/ranker/lib/filter-config';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

const mockResponse = {
  prs: [],
  total: 0,
  filtered: 0,
  owner: 'test',
  repo: 'repo',
  fetchedAt: '2026-01-01T00:00:00Z',
};

describe('usePRs', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not fetch when owner is empty', () => {
    const { result } = renderHook(
      () =>
        usePRs({
          owner: '',
          repo: 'test',
          filters: DEFAULT_FILTER_CONFIG,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when repo is empty', () => {
    const { result } = renderHook(
      () =>
        usePRs({
          owner: 'test',
          repo: '',
          filters: DEFAULT_FILTER_CONFIG,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches when owner and repo are set', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () =>
        usePRs({
          owner: 'test',
          repo: 'repo',
          filters: DEFAULT_FILTER_CONFIG,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(callUrl).toContain('/api/prs?');
    expect(callUrl).toContain('owner=test');
    expect(callUrl).toContain('repo=repo');
  });

  it('throws error on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Authentication required' }),
    });

    const { result } = renderHook(
      () =>
        usePRs({
          owner: 'test',
          repo: 'repo',
          filters: DEFAULT_FILTER_CONFIG,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Authentication required');
  });
});
