// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useQuery } from '@tanstack/react-query';
import type { PRsResponse } from '../types';
import type { FilterConfig } from '../lib/filter-config';

interface UsePRsParams {
  owner: string;
  repo: string;
  filters: FilterConfig;
  limit?: number;
}

async function fetchPRs(params: UsePRsParams): Promise<PRsResponse> {
  const { owner, repo, filters, limit = 50 } = params;

  const searchParams = new URLSearchParams({
    owner,
    repo,
    limit: String(limit),
    excludeDrafts: String(filters.excludeDrafts),
    excludeApproved: String(filters.excludeApproved),
    excludeHold: String(filters.excludeHold),
    excludeConflicts: String(filters.excludeConflicts),
    excludeActiveReviews: String(filters.excludeActiveReviews),
    excludeSkipReview: String(filters.excludeSkipReview),
    holdLabels: filters.holdLabels.join(','),
    skipLabels: filters.skipLabels.join(','),
  });

  const res = await fetch(`/api/prs?${searchParams.toString()}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export function usePRs(params: UsePRsParams) {
  const { owner, repo, filters, limit } = params;
  const enabled = owner.length > 0 && repo.length > 0;

  return useQuery<PRsResponse, Error>({
    queryKey: ['prs', owner, repo, filters, limit],
    queryFn: () => fetchPRs(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}
