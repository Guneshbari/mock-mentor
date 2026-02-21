import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Mock Mentor AI/);
});

test('homepage has a prominent heading', async ({ page }) => {
  await page.goto('/');

  // The landing page should have some heading, let's just check for any heading to be visible
  const heading = page.locator('h1').first();
  await expect(heading).toBeVisible();
});
