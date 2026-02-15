// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { test, expect } from '@playwright/test';

test.describe('Error paths', () => {
  test('401 response shows auth error', async ({ page }) => {
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication required' }),
      });
    });

    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    await expect(
      page.getByText(/auth|token.*missing|token.*invalid/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('404 response shows repo not found', async ({ page }) => {
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Repository not found' }),
      });
    });

    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/nonexistent');
    await input.press('Enter');

    await expect(page.getByText(/not found|does not exist/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('429 response shows rate limit error', async ({ page }) => {
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests' }),
      });
    });

    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    await expect(page.getByText(/rate.*limit|too many/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('500 response shows generic error with retry', async ({ page }) => {
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');

    await expect(
      page.getByText(/error|something went wrong|failed/i)
    ).toBeVisible({ timeout: 10_000 });

    // Retry button should be available
    const retryButton = page.getByRole('button', { name: /retry|try again/i });
    await expect(retryButton).toBeVisible();
  });
});
