// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { NextResponse } from 'next/server';
import { productLogs } from '@/shared/storage/logs';
import { requireAdminAuth } from '@/shared/utils/admin-auth';
import { parseLogParams } from '@/shared/utils/parse-log-params';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = parseLogParams(searchParams);
  if (typeof params === 'string') {
    return NextResponse.json({ error: params }, { status: 400 });
  }

  const result = productLogs.get(params);
  return NextResponse.json(result);
}

export function DELETE(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  productLogs.clear();
  return NextResponse.json({ cleared: true });
}
