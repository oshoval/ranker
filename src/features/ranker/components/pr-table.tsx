// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import * as React from 'react';
import type { FilteredPR, SortConfig, SortField } from '../types';
import { ScoreBadge } from './score-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';

export interface PRTableProps {
  prs: FilteredPR[];
  owner: string;
  repo: string;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sortPRs(prs: FilteredPR[], config: SortConfig): FilteredPR[] {
  const { field, direction } = config;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...prs].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (field) {
      case 'score':
        aVal = a.score;
        bVal = b.score;
        break;
      case 'number':
        aVal = a.number;
        bVal = b.number;
        break;
      case 'additions':
        aVal = a.additions;
        bVal = b.additions;
        break;
      case 'deletions':
        aVal = a.deletions;
        bVal = b.deletions;
        break;
      case 'changedFiles':
        aVal = a.changedFiles;
        bVal = b.changedFiles;
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aVal = new Date(a.updatedAt).getTime();
        bVal = new Date(b.updatedAt).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return multiplier * (aVal - bVal);
    }
    return multiplier * String(aVal).localeCompare(String(bVal));
  });
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentSort: SortConfig;
  onSort: (field: SortField) => void;
}

function SortableHeader({
  field,
  label,
  currentSort,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSort.field === field;
  const isAsc = currentSort.direction === 'asc';
  const ariaSort = isActive
    ? (isAsc ? 'ascending' : 'descending')
    : undefined;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(field);
    }
  };

  return (
    <TableHead aria-sort={ariaSort}>
      <button
        type="button"
        className="flex min-h-[44px] min-w-[44px] items-center gap-1 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        onClick={() => onSort(field)}
        onKeyDown={handleKeyDown}
      >
        {label}
        {isActive ? (
          isAsc ? (
            <ChevronUp className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden />
          )
        ) : (
          <span className="inline-block w-4" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}

interface PRRowProps {
  pr: FilteredPR;
  owner: string;
  repo: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const PRRow = React.memo(function PRRow({
  pr,
  owner,
  repo,
  isExpanded,
  onToggleExpand,
}: PRRowProps) {
  const prUrl = `https://github.com/${owner}/${repo}/pull/${pr.number}`;

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand();
    }
  };

  return (
    <>
      <TableRow
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
        onKeyDown={handleRowKeyDown}
        className="cursor-pointer"
      >
        <TableCell>
          <ScoreBadge
            score={pr.score}
            breakdown={pr.scoreBreakdown}
            size="sm"
          />
        </TableCell>
        <TableCell>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            #{pr.number}
          </a>
        </TableCell>
        <TableCell>
          <span className="text-green-600 dark:text-green-400">
            +{pr.additions}
          </span>
          {' '}
          <span className="text-red-600 dark:text-red-400">
            -{pr.deletions}
          </span>
        </TableCell>
        <TableCell>{pr.changedFiles}</TableCell>
        <TableCell>{formatShortDate(pr.createdAt)}</TableCell>
        <TableCell>{formatShortDate(pr.updatedAt)}</TableCell>
        <TableCell className="w-8">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={7} className="p-4">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Branch:</span>
                {' '}
                {pr.headRefName} → {pr.baseRefName}
              </p>
              {pr.labels.length > 0 && (
                <p>
                  <span className="font-medium">Labels:</span>
                  {' '}
                  {pr.labels.map((l) => l.name).join(', ')}
                </p>
              )}
              {pr.body && (
                <p>
                  <span className="font-medium">Description:</span>
                  {' '}
                  {pr.body.slice(0, 200)}
                  {pr.body.length > 200 ? '…' : ''}
                </p>
              )}
              {pr.files.length > 0 && (
                <p>
                  <span className="font-medium">Files:</span>
                  <ul className="list-inside list-disc mt-1">
                    {pr.files.map((f) => (
                      <li key={f.path}>
                        {f.path}
                        {' '}
                        (
                        <span className="text-green-600 dark:text-green-400">
                          +{f.additions}
                        </span>
                        {' '}
                        <span className="text-red-600 dark:text-red-400">
                          -{f.deletions}
                        </span>
                        )
                      </li>
                    ))}
                  </ul>
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

export function PRTable({ prs, owner, repo }: PRTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    field: 'score',
    direction: 'desc',
  });
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());

  const handleSort = React.useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const toggleExpand = React.useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const sortedPRs = React.useMemo(
    () => sortPRs(prs, sortConfig),
    [prs, sortConfig]
  );

  if (prs.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-card p-8 text-muted-foreground">
          No PRs to display
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              field="score"
              label="Score"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              field="number"
              label="PR#"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              field="additions"
              label="Lines"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              field="changedFiles"
              label="Files"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              field="createdAt"
              label="Created"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              field="updatedAt"
              label="Updated"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPRs.map((pr) => (
            <PRRow
              key={pr.number}
              pr={pr}
              owner={owner}
              repo={repo}
              isExpanded={expandedIds.has(pr.number)}
              onToggleExpand={() => toggleExpand(pr.number)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
