// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { NextResponse } from 'next/server';
import { userLogs } from '@/shared/storage/logs';
import { requireAdminAuth } from '@/shared/utils/admin-auth';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') as
    | 'info'
    | 'warn'
    | 'error'
    | undefined;
  const limit = searchParams.get('limit')
    ? parseInt(searchParams.get('limit')!, 10)
    : undefined;
  const since = searchParams.get('since') ?? undefined;

  const result = userLogs.get({ level: level || undefined, limit, since });
  return NextResponse.json(result);
}

export function DELETE(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  userLogs.clear();
  return NextResponse.json({ cleared: true });
}
