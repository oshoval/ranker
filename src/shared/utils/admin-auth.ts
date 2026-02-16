// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks.
 * Compares buffer byte lengths to handle multi-byte (Unicode) characters.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
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
