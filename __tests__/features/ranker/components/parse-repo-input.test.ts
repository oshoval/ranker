// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { parseRepoInput } from '@/features/ranker/components/pr-filter-view';

describe('parseRepoInput', () => {
  it('parses valid owner/repo format', () => {
    expect(parseRepoInput('kubernetes/kubernetes')).toEqual({
      owner: 'kubernetes',
      repo: 'kubernetes',
    });
  });

  it('parses owner/repo with dots and hyphens', () => {
    expect(parseRepoInput('my-org/my.repo-name')).toEqual({
      owner: 'my-org',
      repo: 'my.repo-name',
    });
  });

  it('parses full GitHub URL', () => {
    expect(parseRepoInput('https://github.com/kubernetes/kubernetes')).toEqual({
      owner: 'kubernetes',
      repo: 'kubernetes',
    });
  });

  it('parses GitHub URL with trailing slash', () => {
    expect(parseRepoInput('https://github.com/owner/repo/')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('parses GitHub URL with extra path segments', () => {
    expect(parseRepoInput('https://github.com/owner/repo/pulls')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('trims whitespace', () => {
    expect(parseRepoInput('  owner/repo  ')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('returns null for empty string', () => {
    expect(parseRepoInput('')).toBeNull();
  });

  it('returns null for whitespace only', () => {
    expect(parseRepoInput('   ')).toBeNull();
  });

  it('returns null for invalid format (no slash)', () => {
    expect(parseRepoInput('justarepo')).toBeNull();
  });

  it('returns null for too many slashes without github.com', () => {
    expect(parseRepoInput('a/b/c')).toBeNull();
  });

  it('returns null for owner starting with special char', () => {
    expect(parseRepoInput('-owner/repo')).toBeNull();
  });

  it('returns null for malicious input', () => {
    expect(parseRepoInput('<script>alert(1)</script>')).toBeNull();
    expect(parseRepoInput('javascript:alert(1)')).toBeNull();
    expect(parseRepoInput('../../etc/passwd')).toBeNull();
  });
});
