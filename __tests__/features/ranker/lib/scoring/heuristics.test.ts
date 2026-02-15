// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import {
  getThresholdScore,
  categorizeFile,
  calculateTestCoverageScore,
  calculateCrossCuttingScore,
  calculateFileTypesScore,
  calculateDocumentationScore,
  isDocumentationOnly,
  countDependencyChanges,
  isRefactoring,
  seemsMechanical,
} from '@/features/ranker/lib/scoring/heuristics';
import type { PRFile } from '@/shared/types';

function makeFile(path: string, additions = 10, deletions = 5): PRFile {
  return { path, additions, deletions, changeType: 'modified' };
}

describe('getThresholdScore', () => {
  const thresholds = [10, 50, 100];
  const scores = [1, 3, 5, 10];

  it('returns first score when value is below first threshold', () => {
    expect(getThresholdScore(5, thresholds, scores)).toBe(1);
  });

  it('returns matching score at threshold boundary', () => {
    expect(getThresholdScore(10, thresholds, scores)).toBe(1);
    expect(getThresholdScore(50, thresholds, scores)).toBe(3);
  });

  it('returns last score when value exceeds all thresholds', () => {
    expect(getThresholdScore(999, thresholds, scores)).toBe(10);
  });
});

describe('categorizeFile', () => {
  it('identifies test files', () => {
    expect(categorizeFile('src/utils.test.ts').name).toBe('test');
    expect(categorizeFile('__tests__/foo.ts').name).toBe('test');
    expect(categorizeFile('e2e/basic.spec.ts').name).toBe('test');
  });

  it('identifies documentation files', () => {
    expect(categorizeFile('README.md').name).toBe('documentation');
    expect(categorizeFile('docs/guide.txt').name).toBe('documentation');
  });

  it('identifies config files', () => {
    expect(categorizeFile('tsconfig.json').name).toBe('config');
    expect(categorizeFile('.prettierrc').name).toBe('config');
    expect(categorizeFile('next.config.ts').name).toBe('config');
  });

  it('identifies dependency files', () => {
    expect(categorizeFile('package.json').name).toBe('dependency');
    expect(categorizeFile('go.mod').name).toBe('dependency');
  });

  it('falls back to core_logic for source files', () => {
    expect(categorizeFile('src/app/page.tsx').name).toBe('core_logic');
    expect(categorizeFile('lib/utils.ts').name).toBe('core_logic');
  });
});

describe('calculateTestCoverageScore', () => {
  it('returns 1 for empty files', () => {
    expect(calculateTestCoverageScore([])).toBe(1);
  });

  it('returns 8 when no tests accompany core changes', () => {
    const files = [makeFile('src/app.ts'), makeFile('src/utils.ts')];
    expect(calculateTestCoverageScore(files)).toBe(8);
  });

  it('returns 1 when test ratio >= 1', () => {
    const files = [
      makeFile('src/app.ts'),
      makeFile('src/app.test.ts'),
      makeFile('src/utils.ts'),
      makeFile('src/utils.test.ts'),
    ];
    expect(calculateTestCoverageScore(files)).toBe(1);
  });

  it('returns lower score with partial test coverage', () => {
    const files = [
      makeFile('src/a.ts'),
      makeFile('src/b.ts'),
      makeFile('src/c.ts'),
      makeFile('src/d.ts'),
      makeFile('src/a.test.ts'),
    ];
    const score = calculateTestCoverageScore(files);
    expect(score).toBeGreaterThan(1);
    expect(score).toBeLessThan(8);
  });
});

describe('calculateCrossCuttingScore', () => {
  it('returns 1 for single area', () => {
    const files = [makeFile('src/a.ts'), makeFile('src/b.ts')];
    expect(calculateCrossCuttingScore(files)).toBe(1);
  });

  it('returns higher score for many areas', () => {
    const files = [
      makeFile('src/a.ts'),
      makeFile('lib/b.ts'),
      makeFile('api/c.ts'),
      makeFile('components/d.tsx'),
      makeFile('hooks/e.ts'),
    ];
    expect(calculateCrossCuttingScore(files)).toBeGreaterThanOrEqual(7);
  });
});

describe('calculateFileTypesScore', () => {
  it('returns 1 for empty files', () => {
    expect(calculateFileTypesScore([])).toBe(1);
  });

  it('returns higher score for core logic files', () => {
    const coreFiles = [makeFile('src/app.ts'), makeFile('src/lib.ts')];
    const docFiles = [makeFile('README.md'), makeFile('CHANGELOG.md')];
    expect(calculateFileTypesScore(coreFiles)).toBeGreaterThan(
      calculateFileTypesScore(docFiles)
    );
  });
});

describe('calculateDocumentationScore', () => {
  it('returns 1 for docs-only PRs', () => {
    const files = [makeFile('README.md'), makeFile('docs/guide.md')];
    expect(calculateDocumentationScore(files)).toBe(1);
  });

  it('returns higher score for no docs', () => {
    const files = [makeFile('src/app.ts')];
    expect(calculateDocumentationScore(files)).toBe(6);
  });
});

describe('isDocumentationOnly', () => {
  it('returns true when all files are docs', () => {
    expect(
      isDocumentationOnly([makeFile('README.md'), makeFile('docs/a.md')])
    ).toBe(true);
  });

  it('returns false when any file is not docs', () => {
    expect(
      isDocumentationOnly([makeFile('README.md'), makeFile('src/a.ts')])
    ).toBe(false);
  });

  it('returns false for empty', () => {
    expect(isDocumentationOnly([])).toBe(false);
  });
});

describe('countDependencyChanges', () => {
  it('counts dependency files', () => {
    const files = [
      makeFile('package.json'),
      makeFile('src/a.ts'),
      makeFile('go.mod'),
    ];
    expect(countDependencyChanges(files)).toBe(2);
  });

  it('returns 0 when no dependency files', () => {
    expect(countDependencyChanges([makeFile('src/a.ts')])).toBe(0);
  });
});

describe('isRefactoring', () => {
  it('detects balanced add/delete ratio with many files', () => {
    const files = Array.from({ length: 8 }, (_, i) => makeFile(`src/f${i}.ts`));
    expect(isRefactoring(files, 100, 80)).toBe(true);
  });

  it('returns false for few files', () => {
    const files = [makeFile('src/a.ts'), makeFile('src/b.ts')];
    expect(isRefactoring(files, 100, 80)).toBe(false);
  });
});

describe('seemsMechanical', () => {
  it('detects uniform changes across many files', () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      makeFile(`src/f${i}.ts`, 5, 5)
    );
    expect(seemsMechanical(files)).toBe(true);
  });

  it('returns false for varied changes', () => {
    const files = [
      makeFile('src/a.ts', 100, 5),
      makeFile('src/b.ts', 1, 50),
      makeFile('src/c.ts', 200, 0),
      makeFile('src/d.ts', 0, 150),
      makeFile('src/e.ts', 50, 25),
    ];
    expect(seemsMechanical(files)).toBe(false);
  });

  it('returns false for fewer than 5 files', () => {
    const files = [makeFile('src/a.ts', 5, 5), makeFile('src/b.ts', 5, 5)];
    expect(seemsMechanical(files)).toBe(false);
  });
});
