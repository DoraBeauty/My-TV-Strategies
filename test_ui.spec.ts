import { test, expect } from '@playwright/test';

test('verify JS logic changes', async ({ page }) => {
  await page.goto('http://localhost:8000');

  await page.waitForTimeout(1000);

  const loginVisible = await page.locator('#guestLoginBtn').isVisible();
  if (loginVisible) {
      await page.click('#guestLoginBtn');
  }

  await page.evaluate(() => {
     document.getElementById('loginView').style.display = 'none';
     document.getElementById('dashboardView').style.display = 'block';
  });

  await page.click('#fabBtn', { force: true });
  await page.waitForSelector('#recordModal', { state: 'visible' });

  await page.evaluate(() => {
     const select = document.getElementById('transportType') as HTMLSelectElement;
     select.value = 'car';
     select.dispatchEvent(new Event('change'));
  });
  await page.waitForSelector('#mileageSection', { state: 'visible' });

  await page.fill('#mileage', '10');
  await page.waitForTimeout(100);

  await expect(page.locator('#totalAmountDisplay')).toHaveText('30'); // 10 * 3 = 30

  await page.evaluate(() => document.getElementById('roundTripBtn').click());
  await expect(page.locator('#mileage')).toHaveValue('20');

  await expect(page.locator('#totalAmountDisplay')).toHaveText('60'); // 20 * 3 = 60

});
