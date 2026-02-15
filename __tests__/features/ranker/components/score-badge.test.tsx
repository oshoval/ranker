// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { ScoreBadge } from '@/features/ranker/components/score-badge';

function wrapWithTooltipProvider(ui: React.ReactElement) {
  return <TooltipProvider>{ui}</TooltipProvider>;
}

describe('ScoreBadge', () => {
  it('renders score 1 with green styling and Easy label', () => {
    render(wrapWithTooltipProvider(<ScoreBadge score={1} />));
    expect(screen.getByText('1 - Easy')).toBeInTheDocument();
    const badge = screen.getByText('1 - Easy').closest('span');
    expect(badge).toHaveClass('bg-green-500/20');
  });

  it('renders score 5 with yellow styling and Medium label', () => {
    render(wrapWithTooltipProvider(<ScoreBadge score={5} />));
    expect(screen.getByText('5 - Medium')).toBeInTheDocument();
    const badge = screen.getByText('5 - Medium').closest('span');
    expect(badge).toHaveClass('bg-yellow-500/20');
  });

  it('renders score 9 with red styling and Hard label', () => {
    render(wrapWithTooltipProvider(<ScoreBadge score={9} />));
    expect(screen.getByText('9 - Hard')).toBeInTheDocument();
    const badge = screen.getByText('9 - Hard').closest('span');
    expect(badge).toHaveClass('bg-red-500/20');
  });

  it('renders score 3 with Easy (boundary)', () => {
    render(wrapWithTooltipProvider(<ScoreBadge score={3} />));
    expect(screen.getByText('3 - Easy')).toBeInTheDocument();
  });

  it('renders score 6 with Medium (boundary)', () => {
    render(wrapWithTooltipProvider(<ScoreBadge score={6} />));
    expect(screen.getByText('6 - Medium')).toBeInTheDocument();
  });

  it('renders score 10 with Hard (boundary)', () => {
    render(wrapWithTooltipProvider(<ScoreBadge score={10} />));
    expect(screen.getByText('10 - Hard')).toBeInTheDocument();
  });
});
