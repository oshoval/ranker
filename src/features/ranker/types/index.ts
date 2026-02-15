// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { GitHubPR } from '@/shared/types';
import type { ScoreBreakdown } from '../lib/scoring/types';

/**
 * A PR with scoring information attached.
 */
export interface FilteredPR extends GitHubPR {
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

/**
 * Criteria for filtering PRs before display.
 */
export interface PRFilterCriteria {
  excludeDrafts: boolean;
  excludeApproved: boolean;
  excludeHold: boolean;
  excludeConflicts: boolean;
  excludeActiveReviews: boolean;
  excludeSkipReview: boolean;
  holdLabels: string[];
  skipLabels: string[];
}

/**
 * Response shape from the /api/prs endpoint.
 */
export interface PRsResponse {
  prs: FilteredPR[];
  total: number;
  filtered: number;
  owner: string;
  repo: string;
  fetchedAt: string;
}

/**
 * Sortable fields in the PR table.
 */
export type SortField =
  | 'score'
  | 'number'
  | 'additions'
  | 'deletions'
  | 'changedFiles'
  | 'createdAt'
  | 'updatedAt';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
