// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { logger } from '@/shared/utils/logger';

export interface LogEntry {
  id: string;
  timestamp: string;
  category: 'product' | 'user';
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
  source?: string;
}

interface GetOptions {
  level?: LogEntry['level'];
  limit?: number;
  since?: string;
}

class LogStore {
  private entries: LogEntry[] = [];
  private readonly maxEntries: number;
  readonly category: LogEntry['category'];

  constructor(category: LogEntry['category'], maxEntries = 500) {
    this.category = category;
    this.maxEntries = maxEntries;
  }

  append(entry: Omit<LogEntry, 'id' | 'timestamp' | 'category'>): LogEntry {
    const full: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      category: this.category,
    };

    this.entries.push(full);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    return full;
  }

  get(opts?: GetOptions): { logs: LogEntry[]; total: number } {
    let filtered = [...this.entries];

    if (opts?.level) {
      filtered = filtered.filter((e) => e.level === opts.level);
    }

    if (opts?.since) {
      const sinceDate = new Date(opts.since).getTime();
      filtered = filtered.filter(
        (e) => new Date(e.timestamp).getTime() >= sinceDate
      );
    }

    const total = filtered.length;
    const limit = opts?.limit ?? 50;
    const logs = filtered.slice(-limit).reverse();

    return { logs, total };
  }

  clear(): void {
    this.entries = [];
  }

  get size(): number {
    return this.entries.length;
  }
}

export const productLogs = new LogStore('product');
export const userLogs = new LogStore('user');

export function logProductError(
  message: string,
  details?: string,
  source?: string
): void {
  logger.error(`[product] ${message}`);
  productLogs.append({ level: 'error', message, details, source });
}

export function logUserError(
  message: string,
  details?: string,
  source?: string
): void {
  logger.warn(`[user] ${message}`);
  userLogs.append({ level: 'error', message, details, source });
}
