// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

/**
 * Configuration for PR filtering.
 * Labels are matched case-insensitively.
 */
export interface FilterConfig {
  holdLabels: string[];
  skipLabels: string[];
  excludeDrafts: boolean;
  excludeApproved: boolean;
  excludeHold: boolean;
  excludeConflicts: boolean;
  excludeActiveReviews: boolean;
  excludeSkipReview: boolean;
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  holdLabels: ['hold', 'on-hold', 'do-not-merge', 'wip', 'blocked'],
  skipLabels: ['skip-review', 'no-review', 'auto-merge'],
  excludeDrafts: true,
  excludeApproved: true,
  excludeHold: true,
  excludeConflicts: false, // PRs with conflicts still need review; author handles rebase
  excludeActiveReviews: false, // PRs with pending reviews ARE the triage target
  excludeSkipReview: true,
};
