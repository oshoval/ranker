// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { ScoringEngine } from '@/features/ranker/lib/scoring/engine';
import type { GitHubPR } from '@/shared/types';

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

describe('ScoringEngine', () => {
  const engine = new ScoringEngine();

  it('scores a documentation-only PR as 1', () => {
    const pr = makePR({
      additions: 5,
      deletions: 0,
      files: [
        {
          path: 'README.md',
          additions: 3,
          deletions: 0,
          changeType: 'modified',
        },
        {
          path: 'docs/guide.md',
          additions: 2,
          deletions: 0,
          changeType: 'added',
        },
      ],
    });
    const { score } = engine.scorePR(pr);
    expect(score).toBe(1);
  });

  it('scores a large PR with many files high', () => {
    // Spread files across multiple system areas for cross-cutting complexity
    const files = [
      ...Array.from({ length: 5 }, (_, i) => ({
        path: `src/features/mod${i}.ts`,
        additions: 80,
        deletions: 30,
        changeType: 'modified' as const,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        path: `lib/utils${i}.ts`,
        additions: 60,
        deletions: 20,
        changeType: 'modified' as const,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        path: `api/routes${i}.ts`,
        additions: 50,
        deletions: 25,
        changeType: 'modified' as const,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        path: `components/ui${i}.tsx`,
        additions: 40,
        deletions: 15,
        changeType: 'modified' as const,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        path: `hooks/use${i}.ts`,
        additions: 20,
        deletions: 10,
        changeType: 'modified' as const,
      })),
    ];
    const pr = makePR({
      additions: 1250,
      deletions: 500,
      changedFiles: 25,
      files,
    });
    const { score } = engine.scorePR(pr);
    expect(score).toBeGreaterThanOrEqual(7);
  });

  it('scores a single-file fix low', () => {
    const pr = makePR({
      additions: 3,
      deletions: 1,
      changedFiles: 1,
      files: [
        {
          path: 'src/utils.ts',
          additions: 3,
          deletions: 1,
          changeType: 'modified',
        },
      ],
    });
    const { score } = engine.scorePR(pr);
    expect(score).toBeLessThanOrEqual(5);
  });

  it('always returns a score between 1 and 10', () => {
    const testCases = [
      makePR({ additions: 0, deletions: 0, files: [] }),
      makePR({
        additions: 10000,
        deletions: 5000,
        files: Array.from({ length: 100 }, (_, i) => ({
          path: `src/f${i}.ts`,
          additions: 100,
          deletions: 50,
          changeType: 'modified' as const,
        })),
      }),
      makePR(),
    ];

    for (const pr of testCases) {
      const { score } = engine.scorePR(pr);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    }
  });

  it('returns a complete breakdown with 7 dimensions + total', () => {
    const { breakdown } = engine.scorePR(makePR());
    expect(breakdown).toHaveProperty('lines');
    expect(breakdown).toHaveProperty('files');
    expect(breakdown).toHaveProperty('fileTypes');
    expect(breakdown).toHaveProperty('deps');
    expect(breakdown).toHaveProperty('tests');
    expect(breakdown).toHaveProperty('docs');
    expect(breakdown).toHaveProperty('crossCutting');
    expect(breakdown).toHaveProperty('total');
  });

  describe('scorePRs', () => {
    it('returns scored PRs sorted by score descending', () => {
      const small = makePR({ number: 1, additions: 2, deletions: 1 });
      const large = makePR({
        number: 2,
        additions: 500,
        deletions: 200,
        changedFiles: 15,
        files: Array.from({ length: 15 }, (_, i) => ({
          path: `src/mod${i}/file.ts`,
          additions: 33,
          deletions: 13,
          changeType: 'modified' as const,
        })),
      });

      const result = engine.scorePRs([small, large]);
      expect(result.length).toBe(2);
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
      expect(result[0]).toHaveProperty('scoreBreakdown');
    });
  });

  describe('getComplexityLabel', () => {
    it('returns Easy for scores 1-3', () => {
      expect(ScoringEngine.getComplexityLabel(1)).toBe('Easy');
      expect(ScoringEngine.getComplexityLabel(3)).toBe('Easy');
    });

    it('returns Medium for scores 4-6', () => {
      expect(ScoringEngine.getComplexityLabel(4)).toBe('Medium');
      expect(ScoringEngine.getComplexityLabel(6)).toBe('Medium');
    });

    it('returns Hard for scores 7-10', () => {
      expect(ScoringEngine.getComplexityLabel(7)).toBe('Hard');
      expect(ScoringEngine.getComplexityLabel(10)).toBe('Hard');
    });
  });

  describe('getComplexityColor', () => {
    it('returns green for 1-3', () => {
      expect(ScoringEngine.getComplexityColor(1)).toBe('green');
      expect(ScoringEngine.getComplexityColor(3)).toBe('green');
    });

    it('returns yellow for 4-6', () => {
      expect(ScoringEngine.getComplexityColor(4)).toBe('yellow');
      expect(ScoringEngine.getComplexityColor(6)).toBe('yellow');
    });

    it('returns red for 7-10', () => {
      expect(ScoringEngine.getComplexityColor(7)).toBe('red');
      expect(ScoringEngine.getComplexityColor(10)).toBe('red');
    });
  });
});
