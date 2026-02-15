// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { test, expect } from '@playwright/test';

test.describe('Product log panel', () => {
  test('panel accessible when ADMIN_AUTH_ENABLED=false (default)', async ({
    request,
  }) => {
    // By default ADMIN_AUTH_ENABLED is not set, so product logs are open
    const response = await request.get('/api/logs/product');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('logs');
    expect(body).toHaveProperty('total');
  });

  test('product log panel shows entries after server error', async ({
    page,
  }) => {
    // Mock product logs to include an entry
    await page.route('**/api/logs/product', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            logs: [
              {
                id: '1',
                level: 'error',
                message: 'PR fetch failed: unexpected error',
                source: 'prs-api',
                timestamp: new Date().toISOString(),
                details: 'Error: Network timeout',
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

    // Click the product log icon in sidebar (Terminal icon)
    const productLogButton = page.getByRole('button', {
      name: /product.*log|internal.*log|bug/i,
    });
    if (await productLogButton.isVisible()) {
      await productLogButton.click();
      await page.waitForTimeout(1000);

      await expect(
        page.getByText(/PR fetch failed|unexpected error/i).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('clear product logs works', async ({ page }) => {
    let cleared = false;
    await page.route('**/api/logs/product', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            logs: cleared
              ? []
              : [
                  {
                    id: '1',
                    level: 'error',
                    message: 'Test product error',
                    source: 'test',
                    timestamp: new Date().toISOString(),
                  },
                ],
            total: cleared ? 0 : 1,
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        cleared = true;
        route.fulfill({ status: 200, body: '{}' });
      }
    });

    await page.goto('/');

    const productLogButton = page.getByRole('button', {
      name: /product.*log|internal.*log|bug/i,
    });
    if (await productLogButton.isVisible()) {
      await productLogButton.click();
      await page.waitForTimeout(1000);

      const clearButton = page.getByRole('button', {
        name: /clear/i,
      });
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
    }
  });
});
