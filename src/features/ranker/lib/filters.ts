// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { GitHubPR } from '@/shared/types';
import type { FilterConfig } from './filter-config';

function normalizeLabel(label: string): string {
  return label.toLowerCase().trim();
}

/**
 * Checks if a PR has an APPROVED review.
 */
export function hasApproval(pr: GitHubPR): boolean {
  return pr.reviews.some((r) => r.state === 'APPROVED');
}

/**
 * Checks if a PR has any label matching the given list (case-insensitive).
 */
export function hasMatchingLabel(pr: GitHubPR, labels: string[]): boolean {
  if (labels.length === 0) return false;
  const normalized = labels.map(normalizeLabel);
  return pr.labels.some((l) => normalized.includes(normalizeLabel(l.name)));
}

/**
 * Checks if a PR has merge conflicts.
 */
export function hasConflicts(pr: GitHubPR): boolean {
  return pr.mergeable === 'CONFLICTING';
}

/**
 * Checks if a PR has active review requests.
 */
export function hasActiveReviewers(pr: GitHubPR): boolean {
  return pr.reviewRequests.length > 0;
}

export interface FilterResult {
  passes: boolean;
  reasons: string[];
}

/**
 * Filters a single PR against the given criteria.
 * Returns whether it passes and the reasons it was filtered (if any).
 */
export function filterPR(pr: GitHubPR, criteria: FilterConfig): FilterResult {
  const reasons: string[] = [];

  if (criteria.excludeDrafts && pr.isDraft) {
    reasons.push('draft');
    return { passes: false, reasons };
  }

  if (criteria.excludeApproved && hasApproval(pr)) {
    reasons.push('approved');
    return { passes: false, reasons };
  }

  if (criteria.excludeHold && hasMatchingLabel(pr, criteria.holdLabels)) {
    reasons.push('hold-label');
    return { passes: false, reasons };
  }

  if (criteria.excludeConflicts && hasConflicts(pr)) {
    reasons.push('conflicts');
    return { passes: false, reasons };
  }

  if (criteria.excludeActiveReviews && hasActiveReviewers(pr)) {
    reasons.push('active-reviews');
    return { passes: false, reasons };
  }

  if (criteria.excludeSkipReview && hasMatchingLabel(pr, criteria.skipLabels)) {
    reasons.push('skip-review');
    return { passes: false, reasons };
  }

  return { passes: true, reasons };
}

export interface FilterPRsResult {
  passed: GitHubPR[];
  filtered: GitHubPR[];
}

/**
 * Filters an array of PRs against the given criteria.
 */
export function filterPRs(
  prs: GitHubPR[],
  criteria: FilterConfig
): FilterPRsResult {
  const passed: GitHubPR[] = [];
  const filtered: GitHubPR[] = [];

  for (const pr of prs) {
    const { passes } = filterPR(pr, criteria);
    if (passes) {
      passed.push(pr);
    } else {
      filtered.push(pr);
    }
  }

  return { passed, filtered };
}
