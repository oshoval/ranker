// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const hasToken = Boolean(process.env.GITHUB_TOKEN);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    githubTokenConfigured: hasToken,
  });
}
