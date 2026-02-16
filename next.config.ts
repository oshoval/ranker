// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { NextConfig } from 'next';
import { execSync } from 'child_process';

function getAppVersion(): string {
  try {
    const tag = execSync('git describe --tags --exact-match 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
    if (tag) return tag;
  } catch {
    /* no tag on HEAD */
  }
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return 'dev';
  }
}

// CSP is handled by src/proxy.ts (nonce-based, per-request).
// Only non-CSP security headers remain here.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: getAppVersion(),
    NEXT_PUBLIC_ENABLE_CREATURES: process.env.ENABLE_CREATURES ?? 'false',
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
