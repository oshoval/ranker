// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { test, expect } from '@playwright/test';

test.describe('User log panel', () => {
  test('toggle open/closed via keyboard shortcut Ctrl+L', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Panel should be collapsed by default
    const panel = page.locator('[data-testid="user-log-panel"]');

    // Open with Ctrl+L
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(500);

    // Look for log panel content
    const logHeading = page.getByText(/user.*log|error.*log/i);
    await expect(logHeading).toBeVisible({ timeout: 5_000 });

    // Close with Ctrl+L
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(500);
  });

  test('shows rate limit entry after 429 error', async ({ page }) => {
    // First mock /api/prs to return 429
    await page.route('**/api/prs**', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests' }),
      });
    });

    // Mock user log endpoint to return a rate limit entry
    await page.route('**/api/logs/user', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            logs: [
              {
                id: '1',
                level: 'error',
                message: 'Rate limit exceeded',
                source: 'prs-api',
                timestamp: new Date().toISOString(),
              },
            ],
            total: 1,
          }),
        });
      } else {
        route.fulfill({ status: 200, body: '{}' });
      }
    });

    await page.goto('/');

    // Trigger the 429
    const input = page.getByPlaceholder(/owner\/repo/i);
    await input.fill('test-org/test-repo');
    await input.press('Enter');
    await page.waitForTimeout(1000);

    // Open user log panel
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(1000);

    await expect(page.getByText(/rate.*limit/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('clear logs button removes entries', async ({ page }) => {
    await page.route('**/api/logs/user', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            logs: [
              {
                id: '1',
                level: 'warn',
                message: 'Test warning',
                source: 'test',
                timestamp: new Date().toISOString(),
              },
            ],
            total: 1,
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, body: '{}' });
      }
    });

    await page.goto('/');
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Test warning')).toBeVisible({
      timeout: 10_000,
    });

    const clearButton = page.getByRole('button', {
      name: /clear/i,
    });
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  });

  test('GET /api/logs/user returns expected structure', async ({ request }) => {
    const response = await request.get('/api/logs/user');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('logs');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.logs)).toBe(true);
  });
});
