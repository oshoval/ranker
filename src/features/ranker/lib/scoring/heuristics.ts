// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { PRFile } from '@/shared/types';
import {
  CROSS_CUTTING_PATTERNS,
  FILE_TYPE_CATEGORIES,
  type FileTypeCategory,
} from './types';

/**
 * Given a value and threshold/score pairs, return the matching score.
 * Thresholds must be in ascending order.
 * Returns the score for the first threshold that value is <= to.
 */
export function getThresholdScore(
  value: number,
  thresholds: number[],
  scores: number[]
): number {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) {
      return scores[i];
    }
  }
  return scores[scores.length - 1];
}

/**
 * Categorize a file path into one of the known file type categories.
 * Returns core_logic as the default fallback.
 */
export function categorizeFile(filePath: string): FileTypeCategory {
  for (const category of FILE_TYPE_CATEGORIES) {
    if (category.name === 'core_logic') continue;
    if (category.patterns.some((p) => p.test(filePath))) {
      return category;
    }
  }
  return FILE_TYPE_CATEGORIES.find((c) => c.name === 'core_logic')!;
}

/**
 * Score based on the diversity and complexity weight of file types changed.
 * More complex file types (core_logic) -> higher score.
 */
export function calculateFileTypesScore(files: PRFile[]): number {
  if (files.length === 0) return 1;

  const categories = new Set<string>();
  let totalWeight = 0;

  for (const file of files) {
    const cat = categorizeFile(file.path);
    categories.add(cat.name);
    totalWeight += cat.complexityWeight;
  }

  const avgWeight = totalWeight / files.length;
  const diversityBonus = Math.min(categories.size - 1, 3);

  const raw = avgWeight * 7 + diversityBonus;
  return Math.max(1, Math.min(10, Math.round(raw)));
}

/**
 * Score based on test coverage.
 * PRs that include test changes alongside code are less risky.
 */
export function calculateTestCoverageScore(files: PRFile[]): number {
  if (files.length === 0) return 1;

  const testFiles = files.filter((f) =>
    FILE_TYPE_CATEGORIES.find((c) => c.name === 'test')!.patterns.some((p) =>
      p.test(f.path)
    )
  );
  const coreFiles = files.filter(
    (f) => categorizeFile(f.path).name === 'core_logic'
  );

  if (coreFiles.length === 0) return 1;
  if (testFiles.length === 0) return 8;

  const ratio = testFiles.length / coreFiles.length;
  if (ratio >= 1) return 1;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 5;
  return 7;
}

/**
 * Score based on documentation changes.
 * Docs-only PRs are trivial to review.
 */
export function calculateDocumentationScore(files: PRFile[]): number {
  if (files.length === 0) return 1;

  const docFiles = files.filter((f) =>
    FILE_TYPE_CATEGORIES.find((c) => c.name === 'documentation')!.patterns.some(
      (p) => p.test(f.path)
    )
  );

  const docRatio = docFiles.length / files.length;
  if (docRatio >= 0.9) return 1;
  if (docRatio >= 0.5) return 3;
  if (docRatio > 0) return 5;
  return 6;
}

/**
 * Check if a PR is documentation-only.
 */
export function isDocumentationOnly(files: PRFile[]): boolean {
  if (files.length === 0) return false;
  return files.every((f) =>
    FILE_TYPE_CATEGORIES.find((c) => c.name === 'documentation')!.patterns.some(
      (p) => p.test(f.path)
    )
  );
}

/**
 * Count how many dependency files are changed.
 */
export function countDependencyChanges(files: PRFile[]): number {
  return files.filter((f) =>
    FILE_TYPE_CATEGORIES.find((c) => c.name === 'dependency')!.patterns.some(
      (p) => p.test(f.path)
    )
  ).length;
}

/**
 * Score based on how many different system areas are touched.
 * More areas = more cross-cutting = harder to review.
 */
export function calculateCrossCuttingScore(files: PRFile[]): number {
  const areas = new Set<string>();

  for (const file of files) {
    for (const pattern of CROSS_CUTTING_PATTERNS) {
      if (pattern.test(file.path)) {
        areas.add(pattern.source);
        break;
      }
    }
  }

  const count = areas.size;
  if (count <= 1) return 1;
  if (count <= 2) return 3;
  if (count <= 3) return 5;
  if (count <= 4) return 7;
  return 9;
}

/**
 * Heuristic: is this PR likely a refactoring?
 * High deletions relative to additions with many files.
 */
export function isRefactoring(
  files: PRFile[],
  additions: number,
  deletions: number
): boolean {
  if (files.length < 3) return false;
  if (additions === 0 && deletions === 0) return false;
  const ratio = deletions / (additions + deletions);
  return ratio >= 0.3 && ratio <= 0.7 && files.length >= 5;
}

/**
 * Heuristic: does this PR seem mechanical (auto-generated, bulk rename, etc.)?
 * Indicated by many files with very similar change sizes.
 */
export function seemsMechanical(files: PRFile[]): boolean {
  if (files.length < 5) return false;

  const changes = files.map((f) => f.additions + f.deletions);
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;

  if (avg === 0) return true;

  const variance =
    changes.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = stdDev / avg;

  return coeffOfVariation < 0.3;
}
