// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import * as React from 'react';
import { ScoringEngine } from '../lib/scoring/engine';
import type { ScoreBreakdown } from '../lib/scoring/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ScoreBadgeProps {
  score: number;
  breakdown?: ScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 min-h-[44px] min-w-[44px]',
  md: 'text-sm px-2.5 py-1 min-h-[44px] min-w-[44px]',
  lg: 'text-base px-3 py-1.5 min-h-[44px] min-w-[44px]',
};

const colorClasses: Record<string, string> = {
  green: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
  yellow:
    'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
  red: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
};

function formatDimensionScores(breakdown: ScoreBreakdown): string {
  const lines = [
    `Lines: ${breakdown.lines}`,
    `Files: ${breakdown.files}`,
    `File types: ${breakdown.fileTypes}`,
    `Dependencies: ${breakdown.deps}`,
    `Tests: ${breakdown.tests}`,
    `Documentation: ${breakdown.docs}`,
    `Cross-cutting: ${breakdown.crossCutting}`,
  ];
  return lines.join('\n');
}

export const ScoreBadge = React.forwardRef<HTMLSpanElement, ScoreBadgeProps>(
  ({ score, breakdown, size = 'md' }, ref) => {
    const label = ScoringEngine.getComplexityLabel(score);
    const color = ScoringEngine.getComplexityColor(score);
    const colorClass = colorClasses[color] ?? colorClasses.green;

    const badgeContent = (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          sizeClasses[size],
          colorClass
        )}
        tabIndex={0}
      >
        {score} - {label}
      </span>
    );

    if (breakdown) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent side="top" className="whitespace-pre-line text-left">
            {formatDimensionScores(breakdown)}
          </TooltipContent>
        </Tooltip>
      );
    }

    return badgeContent;
  }
);
ScoreBadge.displayName = 'ScoreBadge';
