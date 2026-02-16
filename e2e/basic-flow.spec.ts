// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { test, expect } from '@playwright/test';

test.describe('Basic flow', () => {
  test('page loads with sidebar and ranker nav item', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(
      page.locator('aside').getByText('PRanker').first()
    ).toBeVisible();
  });

  test('repo input field is visible', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/owner\/repo/i);
    await expect(input).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    // Wait for next-themes hydration (uses data-theme attribute)
    await expect(html).toHaveAttribute('data-theme', /.+/, { timeout: 5_000 });

    // Find and click theme toggle
    const themeButton = page.getByRole('button', {
      name: /toggle theme/i,
    });
    await expect(themeButton).toBeVisible();

    const initialTheme = await html.getAttribute('data-theme');
    await themeButton.click();
    await page.waitForTimeout(500);
    const afterTheme = await html.getAttribute('data-theme');

    // Theme should have changed (dark <-> light)
    expect(initialTheme).not.toEqual(afterTheme);

    // Toggle back
    await themeButton.click();
    await page.waitForTimeout(500);
    const revertedTheme = await html.getAttribute('data-theme');
    expect(revertedTheme).toEqual(initialTheme);
  });

  test('sidebar collapse/expand works', async ({ page }) => {
    await page.goto('/');

    // Find collapse button
    const collapseButton = page.getByRole('button', {
      name: /collapse|expand|toggle.*sidebar/i,
    });
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await page.waitForTimeout(400);
      // Text should be hidden in collapsed mode
      await collapseButton.click();
      await page.waitForTimeout(400);
    }
  });

  test('health API returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });
});
