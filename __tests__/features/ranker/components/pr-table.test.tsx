// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { PRTable } from '@/features/ranker/components/pr-table';
import type { FilteredPR } from '@/features/ranker/types';

function wrapWithTooltipProvider(ui: React.ReactElement) {
  return <TooltipProvider>{ui}</TooltipProvider>;
}

function makeMockPR(overrides: Partial<FilteredPR> = {}): FilteredPR {
  return {
    number: 42,
    title: 'Test PR',
    body: 'Description here',
    author: 'alice',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T14:00:00Z',
    isDraft: false,
    mergeable: 'MERGEABLE',
    headRefName: 'feat/foo',
    baseRefName: 'main',
    additions: 100,
    deletions: 30,
    changedFiles: 5,
    labels: [{ name: 'bug', color: 'd73a4a' }],
    reviews: [],
    files: [
      {
        path: 'src/app.ts',
        additions: 80,
        deletions: 20,
        changeType: 'modified',
      },
    ],
    reviewRequests: [],
    score: 5,
    scoreBreakdown: {
      lines: 3,
      files: 4,
      fileTypes: 5,
      deps: 1,
      tests: 2,
      docs: 1,
      crossCutting: 2,
      total: 5,
    },
    ...overrides,
  };
}

describe('PRTable', () => {
  it('renders rows from mock data', () => {
    const prs: FilteredPR[] = [
      makeMockPR({ number: 1, title: 'First PR' }),
      makeMockPR({ number: 2, title: 'Second PR' }),
    ];

    render(
      wrapWithTooltipProvider(<PRTable prs={prs} owner="redhat" repo="ranker" />)
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    // Both rows have the same additions/deletions, so use getAllByText
    expect(screen.getAllByText('+100')).toHaveLength(2);
    expect(screen.getAllByText('-30')).toHaveLength(2);
  });

  it('shows empty state message when no PRs', () => {
    render(
      wrapWithTooltipProvider(<PRTable prs={[]} owner="redhat" repo="ranker" />)
    );

    expect(screen.getByText('No PRs to display')).toBeInTheDocument();
  });

  it('builds correct GitHub PR links', () => {
    const prs: FilteredPR[] = [
      makeMockPR({ number: 123 }),
    ];

    render(
      wrapWithTooltipProvider(<PRTable prs={prs} owner="myorg" repo="myrepo" />)
    );

    const link = screen.getByRole('link', { name: '#123' });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/myorg/myrepo/pull/123'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
