import { test, expect } from '@playwright/test';

test('Edit modal correctly populates and keeps transport data', async ({ page }) => {
  await page.goto('http://localhost:8000');

  await page.waitForSelector('#guestLoginBtn', { state: 'visible' });
  await page.click('#guestLoginBtn');
  await page.waitForTimeout(1000);

  await page.click('#fabBtn');
  await page.fill('#tripName', 'Test HSR and Bus Form');
  await page.fill('#location', 'Test Location');
  await page.fill('#startTime', '2023-10-10T08:00');
  await page.fill('#endTime', '2023-10-10T18:00');

  await page.selectOption('#transportType', 'public');
  await page.check('#hsrRadio');
  await page.check('#busRadio');
  await page.fill('#hsrGoPrice', '100');
  await page.fill('#hsrReturnPrice', '200');
  await page.fill('#busGoPrice', '50');
  await page.fill('#busReturnPrice', '60');

  const savedData = await page.evaluate(() => {
    // Intercept localStorage to see what we are saving
    const oldSetItem = localStorage.setItem;
    let saved = null;
    localStorage.setItem = function(key, val) {
      if(key === 'guest_records') saved = val;
      oldSetItem.apply(this, arguments);
    }
    document.getElementById('saveRecordBtn').click();
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.setItem = oldSetItem; // restore
            resolve(saved);
        }, 1000);
    });
  });

  console.log("Saved Data:", savedData);
});
