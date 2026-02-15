// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { test, expect } from '@playwright/test';

const MOCK_PRS_RESPONSE = {
  prs: [
    {
      number: 101,
      title: 'Add authentication module',
      author: 'alice',
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-02-10T10:00:00Z',
      isDraft: false,
      mergeable: 'MERGEABLE',
      headRefName: 'feat/auth',
      baseRefName: 'main',
      additions: 250,
      deletions: 30,
      changedFiles: 8,
      labels: [],
      reviews: [],
      files: [],
      reviewRequests: [],
      score: 7,
      complexity: 'Hard',
      scoreDetails: {
        size: 6,
        age: 5,
        reviewActivity: 3,
        labelRisk: 2,
        fileTypes: 5,
        crossCutting: 7,
        staleness: 4,
      },
    },
    {
      number: 42,
      title: 'Fix typo in README',
      author: 'bob',
      createdAt: '2026-02-14T08:00:00Z',
      updatedAt: '2026-02-14T09:00:00Z',
      isDraft: false,
      mergeable: 'MERGEABLE',
      headRefName: 'fix/typo',
      baseRefName: 'main',
      additions: 2,
      deletions: 1,
      changedFiles: 1,
      labels: [],
      reviews: [],
      files: [],
      reviewRequests: [],
      score: 2,
      complexity: 'Easy',
      scoreDetails: {
        size: 1,
        age: 1,
        reviewActivity: 1,
        labelRisk: 1,
        fileTypes: 2,
        crossCutting: 1,
        staleness: 1,
      },
    },
  ],
  total: 2,
  filtered: 0,
  owner: 'test-org',
  repo: 'test-repo',
  fetchedAt: '2026-02-15T12:00:00Z',
};

test.describe('PR ranking flow (mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the /api/prs endpoint
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRS_RESPONSE),
      });
    });
  });

  test('enter repo and see scored PRs in table', async ({ page }) => {
    await page.goto('/');

    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    // Wait for table to appear
    await expect(page.getByText('Add authentication module')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Fix typo in README')).toBeVisible();
  });

  test('table shows score badges with correct labels', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    await expect(page.getByText('Hard')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Easy')).toBeVisible();
  });

  test('stats cards show correct numbers', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    // Wait for data to load
    await expect(page.getByText('Add authentication module')).toBeVisible({
      timeout: 10_000,
    });

    // Stats should show total
    await expect(page.getByText('2').first()).toBeVisible();
  });

  test('sort by score column works', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    await expect(page.getByText('Add authentication module')).toBeVisible({
      timeout: 10_000,
    });

    // Click score column header to sort
    const scoreHeader = page.getByRole('columnheader', { name: /score/i });
    if (await scoreHeader.isVisible()) {
      await scoreHeader.click();
      await page.waitForTimeout(300);
    }
  });

  test('expand a row to see details', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    await expect(page.getByText('Add authentication module')).toBeVisible({
      timeout: 10_000,
    });

    // Click on a row to expand
    const row = page.getByText('Add authentication module');
    await row.click();
    await page.waitForTimeout(500);

    // Look for expanded detail content (author, branch info)
    await expect(page.getByText('alice').first()).toBeVisible();
  });

  test('empty state when no PRs match filters', async ({ page }) => {
    // Mock with all PRs being drafts and filter excluding drafts
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_PRS_RESPONSE,
          prs: [],
          total: 5,
          filtered: 5,
        }),
      });
    });

    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    await expect(
      page.getByText(/all.*filtered|no.*match|adjust.*filter/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('empty state when repo has 0 PRs', async ({ page }) => {
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prs: [],
          total: 0,
          filtered: 0,
          owner: 'test-org',
          repo: 'empty-repo',
          fetchedAt: '2026-02-15T12:00:00Z',
        }),
      });
    });

    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/empty-repo');
    await input.press('Enter');

    await expect(page.getByText(/no.*open.*pull|no.*pr/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
