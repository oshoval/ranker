// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

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
  return token === adminToken;
}
