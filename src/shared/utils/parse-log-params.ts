// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

const VALID_LEVELS = new Set(['info', 'warn', 'error']);
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 50;

export interface LogQueryParams {
  level?: 'info' | 'warn' | 'error';
  limit?: number;
  since?: string;
}

/**
 * Parse and validate log query parameters from a URL search params object.
 * Returns validated params or an error message string.
 */
export function parseLogParams(
  searchParams: URLSearchParams
): LogQueryParams | string {
  const rawLevel = searchParams.get('level');
  const rawLimit = searchParams.get('limit');
  const rawSince = searchParams.get('since');

  let level: LogQueryParams['level'];
  if (rawLevel) {
    if (!VALID_LEVELS.has(rawLevel)) {
      return `Invalid level: must be one of info, warn, error`;
    }
    level = rawLevel as LogQueryParams['level'];
  }

  let limit: number | undefined;
  if (rawLimit) {
    const parsed = parseInt(rawLimit, 10);
    if (isNaN(parsed) || parsed < 1) {
      return `Invalid limit: must be a positive integer`;
    }
    limit = Math.min(parsed, MAX_LIMIT);
  } else {
    limit = DEFAULT_LIMIT;
  }

  let since: string | undefined;
  if (rawSince) {
    const d = new Date(rawSince);
    if (isNaN(d.getTime())) {
      return `Invalid since: must be a valid ISO 8601 date`;
    }
    since = rawSince;
  }

  return { level, limit, since };
}
