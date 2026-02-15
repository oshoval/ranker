// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { GitHubPR } from '@/shared/types';
import {
  filterPR,
  filterPRs,
  hasApproval,
  hasConflicts,
  hasActiveReviewers,
  hasMatchingLabel,
} from '@/features/ranker/lib/filters';
import {
  DEFAULT_FILTER_CONFIG,
  type FilterConfig,
} from '@/features/ranker/lib/filter-config';

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

describe('filters', () => {
  describe('hasApproval', () => {
    it('returns true when PR has APPROVED review', () => {
      const pr = makePR({
        reviews: [
          {
            author: 'r1',
            state: 'APPROVED',
            submittedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      expect(hasApproval(pr)).toBe(true);
    });

    it('returns false when PR has no approved review', () => {
      const pr = makePR({
        reviews: [
          {
            author: 'r1',
            state: 'CHANGES_REQUESTED',
            submittedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      expect(hasApproval(pr)).toBe(false);
    });
  });

  describe('hasMatchingLabel', () => {
    it('matches labels case-insensitively', () => {
      const pr = makePR({
        labels: [
          { name: 'HOLD', color: '#fff' },
          { name: 'Do-Not-Merge', color: '#000' },
        ],
      });
      expect(hasMatchingLabel(pr, ['hold'])).toBe(true);
      expect(hasMatchingLabel(pr, ['HOLD'])).toBe(true);
      expect(hasMatchingLabel(pr, ['do-not-merge'])).toBe(true);
    });
  });

  describe('hasConflicts', () => {
    it('returns true when mergeable is CONFLICTING', () => {
      expect(hasConflicts(makePR({ mergeable: 'CONFLICTING' }))).toBe(true);
    });

    it('returns false when mergeable is MERGEABLE', () => {
      expect(hasConflicts(makePR({ mergeable: 'MERGEABLE' }))).toBe(false);
    });
  });

  describe('hasActiveReviewers', () => {
    it('returns true when reviewRequests has entries', () => {
      expect(
        hasActiveReviewers(makePR({ reviewRequests: ['alice', 'bob'] }))
      ).toBe(true);
    });

    it('returns false when reviewRequests is empty', () => {
      expect(hasActiveReviewers(makePR({ reviewRequests: [] }))).toBe(false);
    });
  });

  describe('filterPR', () => {
    it('filters draft PR when excludeDrafts=true', () => {
      const pr = makePR({ isDraft: true });
      const result = filterPR(pr, DEFAULT_FILTER_CONFIG);
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('draft');
    });

    it('allows draft PR when excludeDrafts=false', () => {
      const pr = makePR({ isDraft: true });
      const result = filterPR(pr, {
        ...DEFAULT_FILTER_CONFIG,
        excludeDrafts: false,
      });
      expect(result.passes).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it('filters approved PR when excludeApproved=true', () => {
      const pr = makePR({
        reviews: [
          {
            author: 'r1',
            state: 'APPROVED',
            submittedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      const result = filterPR(pr, DEFAULT_FILTER_CONFIG);
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('approved');
    });

    it('allows approved PR when excludeApproved=false', () => {
      const pr = makePR({
        reviews: [
          {
            author: 'r1',
            state: 'APPROVED',
            submittedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      const result = filterPR(pr, {
        ...DEFAULT_FILTER_CONFIG,
        excludeApproved: false,
      });
      expect(result.passes).toBe(true);
    });

    it('filters PR with default hold label', () => {
      const pr = makePR({
        labels: [{ name: 'hold', color: '#fff' }],
      });
      const result = filterPR(pr, DEFAULT_FILTER_CONFIG);
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('hold-label');
    });

    it('filters PR with custom hold label', () => {
      const pr = makePR({
        labels: [{ name: 'blocked', color: '#fff' }],
      });
      const result = filterPR(pr, {
        ...DEFAULT_FILTER_CONFIG,
        holdLabels: ['blocked', 'needs-review'],
      });
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('hold-label');
    });

    it('filters PR with merge conflicts', () => {
      const pr = makePR({ mergeable: 'CONFLICTING' });
      const result = filterPR(pr, DEFAULT_FILTER_CONFIG);
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('conflicts');
    });

    it('filters PR with active reviewers', () => {
      const pr = makePR({ reviewRequests: ['alice'] });
      const result = filterPR(pr, DEFAULT_FILTER_CONFIG);
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('active-reviews');
    });

    it('filters PR with default skip-review label', () => {
      const pr = makePR({
        labels: [{ name: 'skip-review', color: '#fff' }],
      });
      const result = filterPR(pr, DEFAULT_FILTER_CONFIG);
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('skip-review');
    });

    it('filters PR with custom skip-review label', () => {
      const pr = makePR({
        labels: [{ name: 'auto-merge', color: '#fff' }],
      });
      const result = filterPR(pr, {
        ...DEFAULT_FILTER_CONFIG,
        skipLabels: ['auto-merge'],
      });
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('skip-review');
    });

    it('matches labels case-insensitively', () => {
      const pr = makePR({
        labels: [{ name: 'HOLD', color: '#fff' }],
      });
      const result = filterPR(pr, DEFAULT_FILTER_CONFIG);
      expect(result.passes).toBe(false);
      expect(result.reasons).toContain('hold-label');
    });

    it('allows everything when all filters false', () => {
      const allFalse: FilterConfig = {
        holdLabels: [],
        skipLabels: [],
        excludeDrafts: false,
        excludeApproved: false,
        excludeHold: false,
        excludeConflicts: false,
        excludeActiveReviews: false,
        excludeSkipReview: false,
      };

      const draftPr = makePR({ isDraft: true });
      const approvedPr = makePR({
        reviews: [
          {
            author: 'r1',
            state: 'APPROVED',
            submittedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      const holdPr = makePR({
        labels: [{ name: 'hold', color: '#fff' }],
      });
      const conflictPr = makePR({ mergeable: 'CONFLICTING' });
      const activeReviewPr = makePR({ reviewRequests: ['alice'] });
      const skipPr = makePR({
        labels: [{ name: 'skip-review', color: '#fff' }],
      });

      expect(filterPR(draftPr, allFalse).passes).toBe(true);
      expect(filterPR(approvedPr, allFalse).passes).toBe(true);
      expect(filterPR(holdPr, allFalse).passes).toBe(true);
      expect(filterPR(conflictPr, allFalse).passes).toBe(true);
      expect(filterPR(activeReviewPr, allFalse).passes).toBe(true);
      expect(filterPR(skipPr, allFalse).passes).toBe(true);
    });
  });

  describe('filterPRs', () => {
    it('returns correct passed and filtered counts', () => {
      const pass1 = makePR({ number: 1 });
      const pass2 = makePR({ number: 2 });
      const filtered1 = makePR({ number: 3, isDraft: true });
      const filtered2 = makePR({
        number: 4,
        reviews: [
          {
            author: 'r1',
            state: 'APPROVED',
            submittedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const result = filterPRs(
        [pass1, filtered1, pass2, filtered2],
        DEFAULT_FILTER_CONFIG
      );

      expect(result.passed).toHaveLength(2);
      expect(result.filtered).toHaveLength(2);
      expect(result.passed.map((p) => p.number)).toEqual([1, 2]);
      expect(result.filtered.map((p) => p.number)).toEqual([3, 4]);
    });
  });
});
