// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { handleGetPRs } from '@/features/ranker/api/prs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleGetPRs(request);
}
