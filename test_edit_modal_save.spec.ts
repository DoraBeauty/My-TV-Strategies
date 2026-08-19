import { test, expect } from '@playwright/test';

test('Saving an unchanged record retains ticket amounts in DB', async ({ page }) => {
  await page.goto('http://localhost:8000');

  await page.waitForSelector('#guestLoginBtn', { state: 'visible' });
  await page.click('#guestLoginBtn');
  await page.waitForTimeout(1000);

  await page.click('#fabBtn');
  await page.fill('#tripName', 'Keep Amounts Form');
  await page.fill('#location', 'Test Location');
  await page.fill('#startTime', '2023-10-10T08:00');
  await page.fill('#endTime', '2023-10-10T18:00');

  await page.selectOption('#transportType', 'public');

  await page.click('label[for="hsrRadio"]');

  await page.fill('#hsrGoPrice', '999');

  // Submit
  await page.click('#saveRecordBtn');
  await page.waitForTimeout(2000); // wait for save and close

  // Check localStorage db
  let recordsStr = await page.evaluate(() => localStorage.getItem('guest_records'));
  let records = JSON.parse(recordsStr);

  if(records && records.length > 0) {
      expect(records[0].tickets.hsr.go.amount).toBe(999);
  } else {
      throw new Error("No records found!");
  }

  // Navigate to list view to find it reliably without accordions closing on us
  await page.evaluate(() => { document.getElementById('btnList').click(); });
  await page.waitForTimeout(1000);

  // Intercept the open edit modal so we can trace what happens
  await page.evaluate(() => {
      const btns = document.querySelectorAll('.edit-record-btn');
      if (btns.length > 0) {
          btns[0].click();
      }
  });
  await page.waitForTimeout(1000);

  expect(await page.inputValue('#hsrGoPrice')).toBe('999');

  // Click save without changing
  await page.click('#saveRecordBtn');
  await page.waitForTimeout(2000);

  // Check localStorage again
  let recordsStr2 = await page.evaluate(() => localStorage.getItem('guest_records'));
  let records2 = JSON.parse(recordsStr2);
  expect(records2[0].tickets.hsr.go.amount).toBe(999);

  console.log("Save without changes correctly retains 999!");
});
