import { test, expect } from '@playwright/test';

test('verify JS logic changes', async ({ page }) => {
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
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

  await page.click('#openEquipmentModalBtn');
  await page.waitForSelector('#equipmentModal', { state: 'visible' });

  await page.fill('input[data-name="105榴砲"]', '2');
  await page.fill('input[data-name="60迫砲"]', '1');
  await page.fill('#modalEquipmentNote', 'Test note');

  await expect(page.locator('#modalEquipmentTotalQty')).toHaveText('3');

  // Try evaluating the actual close
  await page.evaluate(() => {
    const el = document.getElementById('equipmentModal');
    const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modal.hide();
  });

  await page.evaluate(() => document.getElementById('confirmEquipmentBtn').click());

  await page.waitForSelector('#equipmentModal', { state: 'hidden' });

  await expect(page.locator('#equipmentSummary')).toContainText('60迫砲×1、105榴砲×2（共 3 門）');
  await expect(page.locator('#equipmentNotePreview')).toContainText('Test note');

  // Test Mileage logic
  // Force select Option
  await page.evaluate(() => {
     const select = document.getElementById('transportType') as HTMLSelectElement;
     select.value = 'car';
     select.dispatchEvent(new Event('change'));
  });
  await page.waitForSelector('#mileageSection', { state: 'visible' });

  await page.fill('#mileage', '10');
  await page.waitForTimeout(100);

  await page.evaluate(() => document.getElementById('roundTripBtn').click());
  await expect(page.locator('#mileage')).toHaveValue('20');

  await expect(page.locator('#roundTripBtn')).toHaveClass(/active/);

  await page.evaluate(() => document.getElementById('roundTripBtn').click());
  await expect(page.locator('#mileage')).toHaveValue('10');

  await expect(page.locator('#roundTripBtn')).not.toHaveClass(/active/);

  await page.evaluate(() => document.getElementById('roundTripBtn').click());
  await expect(page.locator('#mileage')).toHaveValue('20');
  await page.fill('#mileage', '30');

  await expect(page.locator('#roundTripBtn')).not.toHaveClass(/active/);

  console.log("Logs:", logs);
});
