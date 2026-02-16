// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Check admin authentication for protected endpoints.
 * Returns true if auth is not enabled OR token is valid.
 * Returns false if auth is enabled and token is missing/invalid.
 */
export function requireAdminAuth(request: Request): boolean {
  const authEnabled = process.env.ADMIN_AUTH_ENABLED === 'true';
  if (!authEnabled) return true;

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  return safeEqual(token, adminToken);
}
