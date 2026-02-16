// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
