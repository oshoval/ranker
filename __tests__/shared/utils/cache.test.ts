// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { SimpleCache } from '@/shared/utils/cache';

describe('SimpleCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('set/get works', () => {
    const cache = new SimpleCache<string>(60_000);
    cache.set('foo', 'bar');
    expect(cache.get('foo')).toBe('bar');
  });

  it('get returns undefined for missing key', () => {
    const cache = new SimpleCache<string>(60_000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('TTL expiry removes entry after ttl', () => {
    const cache = new SimpleCache<string>(1000);
    cache.set('foo', 'bar');
    expect(cache.get('foo')).toBe('bar');
    jest.advanceTimersByTime(999);
    expect(cache.get('foo')).toBe('bar');
    jest.advanceTimersByTime(2);
    expect(cache.get('foo')).toBeUndefined();
  });

  it('prune removes expired entries', () => {
    const cache = new SimpleCache<string>(1000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    jest.advanceTimersByTime(1500);
    const pruned = cache.prune();
    expect(pruned).toBe(3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('prune does not remove non-expired entries', () => {
    const cache = new SimpleCache<string>(2000);
    cache.set('a', '1');
    cache.set('b', '2');
    jest.advanceTimersByTime(1000);
    const pruned = cache.prune();
    expect(pruned).toBe(0);
    expect(cache.get('a')).toBe('1');
    expect(cache.get('b')).toBe('2');
  });

  it('maxSize eviction removes oldest when full', () => {
    const cache = new SimpleCache<string>(60_000, 3);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    expect(cache.size).toBe(3);
    cache.set('d', '4');
    expect(cache.size).toBe(3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
    expect(cache.get('d')).toBe('4');
  });

  it('has returns true for existing key', () => {
    const cache = new SimpleCache<string>(60_000);
    cache.set('foo', 'bar');
    expect(cache.has('foo')).toBe(true);
  });

  it('has returns false for missing key', () => {
    const cache = new SimpleCache<string>(60_000);
    expect(cache.has('missing')).toBe(false);
  });

  it('has returns false for expired key', () => {
    const cache = new SimpleCache<string>(1000);
    cache.set('foo', 'bar');
    jest.advanceTimersByTime(1500);
    expect(cache.has('foo')).toBe(false);
  });

  it('delete removes entry', () => {
    const cache = new SimpleCache<string>(60_000);
    cache.set('foo', 'bar');
    expect(cache.delete('foo')).toBe(true);
    expect(cache.get('foo')).toBeUndefined();
    expect(cache.delete('foo')).toBe(false);
  });

  it('clear removes all entries', () => {
    const cache = new SimpleCache<string>(60_000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});
