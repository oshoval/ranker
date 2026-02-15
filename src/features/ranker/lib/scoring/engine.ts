// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { GitHubPR } from '@/shared/types';
import {
  calculateCrossCuttingScore,
  calculateDocumentationScore,
  calculateFileTypesScore,
  calculateTestCoverageScore,
  countDependencyChanges,
  getThresholdScore,
  isDocumentationOnly,
  isRefactoring,
  seemsMechanical,
} from './heuristics';
import {
  DEFAULT_SCORING_CONFIG,
  type ScoreBreakdown,
  type ScoringConfig,
} from './types';

/**
 * PR complexity scoring engine.
 * Scores PRs on a 1-10 scale across 7 weighted dimensions.
 */
export class ScoringEngine {
  private config: ScoringConfig;

  constructor(config: ScoringConfig = DEFAULT_SCORING_CONFIG) {
    this.config = config;
  }

  /**
   * Score a single PR. Returns the total score (1-10) and per-dimension breakdown.
   */
  scorePR(pr: GitHubPR): { score: number; breakdown: ScoreBreakdown } {
    const { files, additions, deletions } = pr;

    // Short-circuit: documentation-only PRs are trivial
    if (isDocumentationOnly(files)) {
      const breakdown: ScoreBreakdown = {
        lines: 1,
        files: 1,
        fileTypes: 1,
        deps: 1,
        tests: 1,
        docs: 1,
        crossCutting: 1,
        total: 1,
      };
      return { score: 1, breakdown };
    }

    const totalLines = additions + deletions;

    // Calculate each dimension (1-10)
    const lines = getThresholdScore(
      totalLines,
      [10, 50, 100, 250, 500, 1000],
      [1, 2, 3, 5, 7, 9, 10]
    );

    const fileCount = getThresholdScore(
      files.length,
      [1, 3, 5, 10, 20, 50],
      [1, 2, 3, 5, 7, 9, 10]
    );

    const fileTypes = calculateFileTypesScore(files);
    const tests = calculateTestCoverageScore(files);
    const docs = calculateDocumentationScore(files);
    const crossCutting = calculateCrossCuttingScore(files);

    const depChanges = countDependencyChanges(files);
    const deps = getThresholdScore(depChanges, [0, 1, 2, 3], [1, 3, 5, 7, 9]);

    // Weighted sum
    const weights = this.getWeightMap();
    let weighted =
      lines * weights.lines +
      fileCount * weights.files +
      fileTypes * weights.fileTypes +
      deps * weights.deps +
      tests * weights.tests +
      docs * weights.docs +
      crossCutting * weights.crossCutting;

    // Adjustments for special patterns
    if (isRefactoring(files, additions, deletions)) {
      weighted = Math.min(10, weighted * 1.15);
    }
    if (seemsMechanical(files)) {
      weighted = Math.max(1, weighted * 0.6);
    }

    const total = Math.max(1, Math.min(10, Math.round(weighted)));

    const breakdown: ScoreBreakdown = {
      lines,
      files: fileCount,
      fileTypes,
      deps,
      tests,
      docs,
      crossCutting,
      total,
    };

    return { score: total, breakdown };
  }

  /**
   * Score multiple PRs, returning them sorted by score (highest first).
   */
  scorePRs(
    prs: GitHubPR[]
  ): Array<GitHubPR & { score: number; scoreBreakdown: ScoreBreakdown }> {
    return prs
      .map((pr) => {
        const { score, breakdown } = this.scorePR(pr);
        return { ...pr, score, scoreBreakdown: breakdown };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Human-readable complexity label for a score.
   */
  static getComplexityLabel(score: number): string {
    if (score <= 3) return 'Easy';
    if (score <= 6) return 'Medium';
    return 'Hard';
  }

  /**
   * Color for the complexity badge.
   */
  static getComplexityColor(score: number): 'green' | 'yellow' | 'red' {
    if (score <= 3) return 'green';
    if (score <= 6) return 'yellow';
    return 'red';
  }

  private getWeightMap(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const rule of this.config.rules) {
      map[rule.name] = rule.weight;
    }
    return map;
  }
}

/**
 * Default scoring engine singleton.
 */
export const scoringEngine = new ScoringEngine();
