// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const REFRESH_MS = 30_000;
const LOG_API = '/api/logs/product';
const TOKEN_KEY = 'pranker_admin_token';

export interface LogEntry {
  id: string;
  timestamp: string;
  category: 'product' | 'user';
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
  source?: string;
}

export interface ProductLogPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ProductLogPanel({ open, onClose }: ProductLogPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const getAuthHeader = useCallback(() => {
    if (typeof window === 'undefined') return undefined;
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const headers = getAuthHeader();
      const res = await fetch(LOG_API, { headers });
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(TOKEN_KEY);
        }
        setNeedsAuth(true);
        setLogs([]);
        setTotal(0);
        return;
      }
      setNeedsAuth(false);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setNeedsAuth(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (open) {
      void fetchLogs();
      const id = setInterval(fetchLogs, REFRESH_MS);
      return () => clearInterval(id);
    }
  }, [open, fetchLogs]);

  const handleSubmitToken = async () => {
    if (!tokenInput.trim()) return;
    sessionStorage.setItem(TOKEN_KEY, tokenInput.trim());
    setTokenInput('');
    setAuthError(false);
    try {
      const headers = getAuthHeader();
      const res = await fetch(LOG_API, { headers });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setNeedsAuth(true);
        setAuthError(true);
        return;
      }
      setNeedsAuth(false);
      void fetchLogs();
    } catch {
      setAuthError(true);
    }
  };

  const handleClear = async () => {
    try {
      const headers = getAuthHeader();
      const res = await fetch(LOG_API, { method: 'DELETE', headers });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (res.ok) {
        setLogs([]);
        setTotal(0);
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

  if (needsAuth) {
    return (
      <div className="flex flex-col border-t border-border">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4" />
            <span>Product error logs</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 p-3">
          <p className="text-sm text-muted-foreground">
            Enter admin token to view product logs.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Admin token"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setAuthError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitToken()}
              className={cn(authError && 'border-destructive')}
            />
            <Button onClick={handleSubmitToken}>Submit</Button>
          </div>
          {authError && (
            <p className="text-sm text-destructive">Invalid token</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-t border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          onClick={() => setInternalCollapsed((c) => !c)}
          className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
        >
          <Terminal className="h-4 w-4" />
          <span>Product error logs</span>
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
              No product logs
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
