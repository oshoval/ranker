// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

/**
 * A single scoring dimension with a weight and evaluation function name.
 */
export interface ScoringRule {
  name: string;
  weight: number;
}

/**
 * Full scoring configuration -- weights must sum to 1.0.
 */
export interface ScoringConfig {
  rules: ScoringRule[];
}

/**
 * Category for a changed file, used to assess complexity.
 */
export interface FileTypeCategory {
  name: string;
  patterns: RegExp[];
  complexityWeight: number;
}

/**
 * Breakdown of the score by dimension (each 1-10).
 */
export interface ScoreBreakdown {
  lines: number;
  files: number;
  fileTypes: number;
  deps: number;
  tests: number;
  docs: number;
  crossCutting: number;
  total: number;
}

/**
 * Default weights for the 7 scoring dimensions.
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  rules: [
    { name: 'lines', weight: 0.25 },
    { name: 'files', weight: 0.2 },
    { name: 'fileTypes', weight: 0.15 },
    { name: 'deps', weight: 0.15 },
    { name: 'tests', weight: 0.1 },
    { name: 'docs', weight: 0.05 },
    { name: 'crossCutting', weight: 0.1 },
  ],
};

/**
 * File type categories for complexity assessment.
 */
export const FILE_TYPE_CATEGORIES: FileTypeCategory[] = [
  {
    name: 'documentation',
    patterns: [
      /\.md$/i,
      /\.txt$/i,
      /\.rst$/i,
      /CHANGELOG/i,
      /LICENSE/i,
      /NOTICE/i,
    ],
    complexityWeight: 0.1,
  },
  {
    name: 'config',
    patterns: [
      /\.json$/i,
      /\.ya?ml$/i,
      /\.toml$/i,
      /\.ini$/i,
      /\.env/i,
      /\.config\./i,
      /\.prettierrc/i,
      /\.eslintrc/i,
      /Makefile$/i,
      /Dockerfile$/i,
    ],
    complexityWeight: 0.3,
  },
  {
    name: 'test',
    patterns: [
      /\.test\./i,
      /\.spec\./i,
      /\/__tests__\//i,
      /\/e2e\//i,
      /\.stories\./i,
    ],
    complexityWeight: 0.4,
  },
  {
    name: 'generated',
    patterns: [/\.lock$/i, /\.min\./i, /\/dist\//i, /\/build\//i, /\.d\.ts$/i],
    complexityWeight: 0.1,
  },
  {
    name: 'dependency',
    patterns: [
      /package\.json$/i,
      /go\.mod$/i,
      /go\.sum$/i,
      /requirements\.txt$/i,
      /Cargo\.toml$/i,
    ],
    complexityWeight: 0.5,
  },
  {
    name: 'core_logic',
    patterns: [
      /\.tsx?$/i,
      /\.jsx?$/i,
      /\.go$/i,
      /\.py$/i,
      /\.rs$/i,
      /\.java$/i,
    ],
    complexityWeight: 1.0,
  },
];

/**
 * Paths that indicate cross-cutting changes (touching multiple system areas).
 */
export const CROSS_CUTTING_PATTERNS: RegExp[] = [
  /^src\//i,
  /^lib\//i,
  /^api\//i,
  /^components\//i,
  /^hooks\//i,
  /^utils\//i,
  /^shared\//i,
  /^features\//i,
  /^app\//i,
];
