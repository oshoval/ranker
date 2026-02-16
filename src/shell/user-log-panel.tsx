// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const REFRESH_MS = 30_000;
const LOG_API = '/api/logs/user';
const TOKEN_KEY = 'pranker_admin_token';

function getAuthHeaders(): HeadersInit | undefined {
  if (typeof window === 'undefined') return undefined;
  const token = sessionStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  category: 'product' | 'user';
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
  source?: string;
}

export interface UserLogPanelProps {
  open: boolean;
  onClose: () => void;
  onLogCountChange?: (count: number) => void;
}

export function UserLogPanel({
  open,
  onClose,
  onLogCountChange,
}: UserLogPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const fetchLogs = useCallback(
    async (signal?: { cancelled: boolean }) => {
      try {
        const res = await fetch(LOG_API, { headers: getAuthHeaders() });
        if (res.ok && !signal?.cancelled) {
          const data = await res.json();
          setLogs(data.logs ?? []);
          setTotal(data.total ?? 0);
          onLogCountChange?.(data.total ?? 0);
        }
      } catch {
        // ignore
      }
    },
    [onLogCountChange]
  );

  useEffect(() => {
    if (open) {
      const signal = { cancelled: false };
      const t = setTimeout(() => fetchLogs(signal), 0);
      const id = setInterval(() => fetchLogs(signal), REFRESH_MS);
      return () => {
        signal.cancelled = true;
        clearTimeout(t);
        clearInterval(id);
      };
    }
  }, [open, fetchLogs]);

  const handleClear = async () => {
    try {
      const res = await fetch(LOG_API, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setLogs([]);
        setTotal(0);
        onLogCountChange?.(0);
      }
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  const levelStyles = {
    info: 'bg-muted text-muted-foreground',
    warn: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    error: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
  };

  return (
    <div className="flex flex-col border-t border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          onClick={() => setInternalCollapsed((c) => !c)}
          className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
        >
          <AlertCircle className="h-4 w-4" />
          <span>User error logs</span>
          {total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {total}
            </Badge>
          )}
          {internalCollapsed ? (
            <ChevronDown className="ml-auto h-4 w-4" />
          ) : (
            <ChevronUp className="ml-auto h-4 w-4" />
          )}
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear logs
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {!internalCollapsed && (
        <div className="max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No user logs
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <div
                    key={log.id}
                    className="cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-muted/30"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <Badge
                        className={cn(
                          'text-xs',
                          levelStyles[log.level] ?? levelStyles.info
                        )}
                      >
                        {log.level}
                      </Badge>
                      <span className="flex-1">{log.message}</span>
                      {log.source && (
                        <span className="text-xs text-muted-foreground">
                          {log.source}
                        </span>
                      )}
                    </div>
                    {isExpanded && log.details && (
                      <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs">
                        {log.details}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
