// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// In development, Next.js/Turbopack injects inline scripts for HMR that
// require 'unsafe-inline' and 'unsafe-eval'. In production a nonce-based
// approach should be used (see GOING_PUBLIC.md).
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

const nextConfig: NextConfig = {
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
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.github.com; frame-ancestors 'none';`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
