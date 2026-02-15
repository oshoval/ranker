// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import '@testing-library/jest-dom';

// jsdom does not provide Fetch API globals (Request, Response).
// Node 22+ has them natively but jsdom replaces the global scope.
// Minimal polyfills for API route tests that use these constructors.
if (typeof globalThis.Request === 'undefined') {
  class MinimalRequest {
    readonly url: string;
    readonly method: string;
    readonly headers: Headers;

    constructor(
      input: string,
      init?: { headers?: Record<string, string>; method?: string }
    ) {
      this.url = input;
      this.method = init?.method ?? 'GET';
      this.headers = new Headers(init?.headers);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Request = MinimalRequest;
}

if (typeof globalThis.Response === 'undefined') {
  class MinimalResponse {
    readonly status: number;
    readonly statusText: string;
    readonly headers: Headers;
    private readonly _body: string;

    constructor(
      body?: string | null,
      init?: {
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
      }
    ) {
      this._body = body ?? '';
      this.status = init?.status ?? 200;
      this.statusText = init?.statusText ?? '';
      this.headers = new Headers(init?.headers);
    }

    async json() {
      return JSON.parse(this._body);
    }

    async text() {
      return this._body;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Response = MinimalResponse;
}

if (typeof globalThis.Headers === 'undefined') {
  class MinimalHeaders {
    private _map: Map<string, string>;

    constructor(init?: Record<string, string>) {
      this._map = new Map(
        Object.entries(init ?? {}).map(([k, v]) => [k.toLowerCase(), v])
      );
    }

    get(name: string): string | null {
      return this._map.get(name.toLowerCase()) ?? null;
    }

    set(name: string, value: string) {
      this._map.set(name.toLowerCase(), value);
    }

    has(name: string): boolean {
      return this._map.has(name.toLowerCase());
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Headers = MinimalHeaders;
}
