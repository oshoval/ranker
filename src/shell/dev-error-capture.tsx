// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useEffect } from 'react';

const ENDPOINT = '/api/dev-errors';

function send(payload: {
  type: string;
  message: string;
  source?: string;
  stack?: string;
}) {
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort, don't recurse
  }
}

/**
 * Dev-only component that captures client-side errors and console.error
 * calls, forwarding them to /api/dev-errors so they can be read via curl.
 *
 * Captures: window.onerror, unhandledrejection, and console.error.
 * Renders nothing.
 */
export function DevErrorCapture() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // 1. Global error handler
    const onError = (event: ErrorEvent) => {
      send({
        type: 'window.onerror',
        message: event.message,
        source: `${event.filename ?? ''}:${event.lineno ?? ''}:${event.colno ?? ''}`,
        stack: event.error?.stack,
      });
    };

    // 2. Unhandled promise rejections
    const onRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      send({
        type: 'unhandledrejection',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    };

    // 3. Intercept console.error (catches React/Next.js warnings)
    const originalConsoleError = console.error;
    const consoleErrorOverride = (...args: unknown[]) => {
      originalConsoleError.apply(console, args);

      const message = args
        .map((a) =>
          typeof a === 'string'
            ? a
            : a instanceof Error
              ? a.message
              : JSON.stringify(a)
        )
        .join(' ')
        .slice(0, 2000);

      send({
        type: 'console.error',
        message,
        stack:
          args.find((a): a is Error => a instanceof Error)?.stack ?? undefined,
      });
    };
    console.error = consoleErrorOverride;

    // 4. Intercept console.warn (Next.js sometimes uses warnings)
    const originalConsoleWarn = console.warn;
    const consoleWarnOverride = (...args: unknown[]) => {
      originalConsoleWarn.apply(console, args);

      const message = args
        .map((a) =>
          typeof a === 'string'
            ? a
            : a instanceof Error
              ? a.message
              : JSON.stringify(a)
        )
        .join(' ')
        .slice(0, 2000);

      send({
        type: 'console.warn',
        message,
      });
    };
    console.warn = consoleWarnOverride;

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return null;
}
