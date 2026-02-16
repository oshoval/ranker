// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import * as React from 'react';
import { RefreshCw, Search, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClickCreatures } from '@/components/click-creatures';
import { PRTable } from './pr-table';
import { usePRs } from '../hooks/use-prs';
import { DEFAULT_FILTER_CONFIG, type FilterConfig } from '../lib/filter-config';

// ─── Parse repo input ───────────────────────────────────────

const OWNER_REPO_RE =
  /^([a-zA-Z0-9][a-zA-Z0-9._-]{0,99})\/([a-zA-Z0-9][a-zA-Z0-9._-]{0,99})$/;
const GITHUB_URL_RE =
  /^https?:\/\/github\.com\/([a-zA-Z0-9][a-zA-Z0-9._-]{0,99})\/([a-zA-Z0-9][a-zA-Z0-9._-]{0,99})\/?/;

export function parseRepoInput(
  input: string
): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(GITHUB_URL_RE);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };

  const shortMatch = trimmed.match(OWNER_REPO_RE);
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

  return null;
}

// ─── localStorage helpers ───────────────────────────────────

const RECENT_REPOS_KEY = 'pranker:recent-repos';
const CUSTOM_LABELS_KEY = 'pranker:custom-labels';
const MAX_RECENT = 5;

function loadRecentRepos(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_REPOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return parsed
      .filter((v): v is string => typeof v === 'string')
      .filter((v) => parseRepoInput(v) !== null)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecentRepo(ownerRepo: string) {
  const recent = loadRecentRepos().filter((r) => r !== ownerRepo);
  recent.unshift(ownerRepo);
  localStorage.setItem(
    RECENT_REPOS_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

function loadCustomLabels(): {
  holdLabels: string[];
  skipLabels: string[];
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOM_LABELS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCustomLabels(holdLabels: string[], skipLabels: string[]) {
  localStorage.setItem(
    CUSTOM_LABELS_KEY,
    JSON.stringify({ holdLabels, skipLabels })
  );
}

// ─── Component ──────────────────────────────────────────────

export function PRFilterView() {
  const [repoInput, setRepoInput] = React.useState('');
  const [owner, setOwner] = React.useState('');
  const [repo, setRepo] = React.useState('');
  const [recentRepos, setRecentRepos] = React.useState<string[]>([]);
  const [showRecent, setShowRecent] = React.useState(false);
  const [tokenMissing, setTokenMissing] = React.useState(false);

  const [filters, setFilters] = React.useState<FilterConfig>(() => {
    const custom = loadCustomLabels();
    return {
      ...DEFAULT_FILTER_CONFIG,
      ...(custom
        ? { holdLabels: custom.holdLabels, skipLabels: custom.skipLabels }
        : {}),
    };
  });

  const [holdLabelsInput, setHoldLabelsInput] = React.useState(() =>
    filters.holdLabels.join(', ')
  );
  const [skipLabelsInput, setSkipLabelsInput] = React.useState(() =>
    filters.skipLabels.join(', ')
  );

  React.useEffect(() => {
    setRecentRepos(loadRecentRepos());
  }, []);

  const { data, error, isLoading, isFetching, refetch } = usePRs({
    owner,
    repo,
    filters,
  });

  // Detect missing GitHub token from API 401 response
  React.useEffect(() => {
    if (error?.message === 'Authentication required') {
      setTokenMissing(true);
    }
  }, [error]);

  const handleSubmit = React.useCallback(() => {
    const parsed = parseRepoInput(repoInput);
    if (!parsed) return;
    setOwner(parsed.owner);
    setRepo(parsed.repo);
    const key = `${parsed.owner}/${parsed.repo}`;
    saveRecentRepo(key);
    setRecentRepos(loadRecentRepos());
    setShowRecent(false);
  }, [repoInput]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    },
    [handleSubmit]
  );

  const handleFilterToggle = React.useCallback((key: keyof FilterConfig) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleLabelsBlur = React.useCallback(() => {
    const holdLabels = holdLabelsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const skipLabels = skipLabelsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setFilters((prev) => ({
      ...prev,
      holdLabels:
        holdLabels.length > 0 ? holdLabels : DEFAULT_FILTER_CONFIG.holdLabels,
      skipLabels:
        skipLabels.length > 0 ? skipLabels : DEFAULT_FILTER_CONFIG.skipLabels,
    }));
    saveCustomLabels(
      holdLabels.length > 0 ? holdLabels : DEFAULT_FILTER_CONFIG.holdLabels,
      skipLabels.length > 0 ? skipLabels : DEFAULT_FILTER_CONFIG.skipLabels
    );
  }, [holdLabelsInput, skipLabelsInput]);

  const handleResetLabels = React.useCallback(() => {
    setHoldLabelsInput(DEFAULT_FILTER_CONFIG.holdLabels.join(', '));
    setSkipLabelsInput(DEFAULT_FILTER_CONFIG.skipLabels.join(', '));
    setFilters((prev) => ({
      ...prev,
      holdLabels: DEFAULT_FILTER_CONFIG.holdLabels,
      skipLabels: DEFAULT_FILTER_CONFIG.skipLabels,
    }));
    localStorage.removeItem(CUSTOM_LABELS_KEY);
  }, []);

  const selectRecent = React.useCallback((r: string) => {
    setRepoInput(r);
    setShowRecent(false);
    const parsed = parseRepoInput(r);
    if (parsed) {
      setOwner(parsed.owner);
      setRepo(parsed.repo);
    }
  }, []);

  // ─── Stats ──────────────────────────────────────────────────

  const totalOpen = data?.total ?? 0;
  const readyForReview = data?.prs.length ?? 0;
  const easyPRs = data?.prs.filter((pr) => pr.score <= 3).length ?? 0;
  const filteredCount = data?.filtered ?? 0;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Token missing warning */}
      {tokenMissing && (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">GitHub token not configured</p>
            <p className="mt-1 text-amber-600 dark:text-amber-400">
              Create a{' '}
              <code className="rounded bg-amber-500/20 px-1">.env.local</code>{' '}
              file with your{' '}
              <code className="rounded bg-amber-500/20 px-1">GITHUB_TOKEN</code>
              . See{' '}
              <code className="rounded bg-amber-500/20 px-1">
                .env.local.example
              </code>{' '}
              for the format. Restart the dev server after adding it.
            </p>
          </div>
        </div>
      )}

      {/* Repo Input */}
      <Card className="relative">
        {/* Creature overlay – click the card background to summon creatures */}
        <ClickCreatures />
        <CardHeader>
          <CardTitle className="text-lg">Repository</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="owner/repo or https://github.com/owner/repo"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => recentRepos.length > 0 && setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                className="pr-10"
              />
              {showRecent && recentRepos.length > 0 && (
                <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                  {recentRepos.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={() => selectRecent(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!parseRepoInput(repoInput)}
            >
              <Search className="mr-2 h-4 w-4" />
              Load PRs
            </Button>
            {owner && repo && (
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                />
                <span className="sr-only">Refresh</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {owner && repo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ['excludeDrafts', 'Hide Drafts'],
                  ['excludeApproved', 'Hide Approved'],
                  ['excludeHold', 'Hide On Hold'],
                  ['excludeConflicts', 'Hide Conflicts'],
                  ['excludeActiveReviews', 'Hide Active Reviews'],
                  ['excludeSkipReview', 'Hide Skip-Review'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={filters[key] as boolean}
                    onCheckedChange={() => handleFilterToggle(key)}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Label configuration */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="holdLabels" className="text-sm font-medium">
                  Hold labels (comma-separated)
                </Label>
                <Input
                  id="holdLabels"
                  value={holdLabelsInput}
                  onChange={(e) => setHoldLabelsInput(e.target.value)}
                  onBlur={handleLabelsBlur}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="skipLabels" className="text-sm font-medium">
                  Skip labels (comma-separated)
                </Label>
                <Input
                  id="skipLabels"
                  value={skipLabelsInput}
                  onChange={(e) => setSkipLabelsInput(e.target.value)}
                  onBlur={handleLabelsBlur}
                  className="mt-1"
                />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetLabels}>
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset labels to defaults
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Open" value={totalOpen} />
          <StatCard title="Ready for Review" value={readyForReview} />
          <StatCard title="Easy PRs" value={easyPRs} variant="green" />
          <StatCard
            title="Filtered Out"
            value={filteredCount}
            variant="muted"
          />
        </div>
      )}

      {/* Info banner when limited */}
      {data && data.prs.length < data.total - data.filtered && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <Info className="h-4 w-4 flex-shrink-0" />
          Showing {data.prs.length} of {data.total - data.filtered} matching PRs
        </div>
      )}

      {/* Updating indicator */}
      {isFetching && !isLoading && (
        <div className="text-sm text-muted-foreground">Updating...</div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">{error.message}</div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {/* PR Table */}
      {data && !isLoading && (
        <>
          {data.prs.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              {data.total === 0
                ? 'No open PRs in this repository.'
                : 'No PRs match the current filters — try relaxing some filters.'}
            </div>
          ) : (
            <PRTable prs={data.prs} owner={owner} repo={repo} />
          )}
        </>
      )}

      {/* Empty state: no repo selected */}
      {!owner && !repo && !isLoading && (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          <h3 className="mb-2 text-lg font-medium text-foreground">
            Welcome to PRanker
          </h3>
          <p>
            Enter a GitHub repository above to see its open pull requests ranked
            by review complexity. PRs are scored 1-10 based on size, file types,
            test coverage, and more.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Stats Card ─────────────────────────────────────────────

function StatCard({
  title,
  value,
  variant,
}: {
  title: string;
  value: number;
  variant?: 'green' | 'muted';
}) {
  const valueClass =
    variant === 'green'
      ? 'text-green-600 dark:text-green-400'
      : variant === 'muted'
        ? 'text-muted-foreground'
        : 'text-foreground';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
