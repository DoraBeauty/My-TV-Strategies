import { test, expect } from '@playwright/test';

test('verify JS logic changes', async ({ page }) => {
  await page.goto('http://localhost:8000/');

  // click mobile menu button
  await page.click('#mobileMenuBtn');

  await expect(page.locator('.dropdown-menu')).toBeVisible();

  // click first info icon
  await page.locator('.info-icon-dropdown').first().click();

  // Dropdown should still be visible
  await expect(page.locator('.dropdown-menu')).toBeVisible();
  await expect(page.locator('.popover')).toBeVisible();
});
