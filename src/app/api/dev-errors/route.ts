// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

/**
 * Dev-only API for capturing client-side errors.
 * GET    → return captured errors
 * POST   → store a new error
 * DELETE → clear all captured errors
 *
 * Protection:
 *   When ADMIN_AUTH_ENABLED=true, GET and DELETE require the ADMIN_TOKEN
 *   via `Authorization: Bearer <token>` header.
 *   POST is always open (used by the client-side capture component).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/shared/utils/admin-auth';

export const dynamic = 'force-dynamic';

interface CapturedError {
  timestamp: string;
  type: string;
  message: string;
  source?: string;
  stack?: string;
}

// In-memory store (resets on server restart)
const errors: CapturedError[] = [];
const MAX_ERRORS = 50;
const MAX_PAYLOAD_BYTES = 16_384; // 16 KB max per POST body
const MAX_FIELD_LENGTH = 4_096; // 4 KB max per field

function isDevOnly(): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }
  return null;
}

export function GET(req: NextRequest) {
  const devBlock = isDevOnly();
  if (devBlock) return devBlock;

  if (!requireAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    count: errors.length,
    errors: errors.slice().reverse(), // newest first
  });
}

export async function POST(req: NextRequest) {
  const devBlock = isDevOnly();
  if (devBlock) return devBlock;

  // POST is always open — comes from the client-side capture component
  try {
    const contentLength = parseInt(
      req.headers.get('content-length') ?? '0',
      10
    );
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = await req.json();

    const truncate = (val: string) => val.slice(0, MAX_FIELD_LENGTH);

    const entry: CapturedError = {
      timestamp: new Date().toISOString(),
      type: truncate(String(body.type ?? 'unknown')),
      message: truncate(String(body.message ?? '')),
      source: body.source ? truncate(String(body.source)) : undefined,
      stack: body.stack ? truncate(String(body.stack)) : undefined,
    };

    errors.push(entry);

    // Cap the list
    while (errors.length > MAX_ERRORS) {
      errors.shift();
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

export function DELETE(req: NextRequest) {
  const devBlock = isDevOnly();
  if (devBlock) return devBlock;

  if (!requireAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  errors.length = 0;
  return NextResponse.json({ ok: true, cleared: true });
}
