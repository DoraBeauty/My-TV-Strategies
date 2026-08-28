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

  // Checking radios is tricky natively because of Bootstrap custom components and timing.
  // We'll evaluate in browser to be 100% sure the dom events fire
  await page.evaluate(() => {
     document.getElementById('hsrRadio').checked = true;
     document.getElementById('hsrRadio').dispatchEvent(new Event('change'));
     document.getElementById('busRadio').checked = true;
     document.getElementById('busRadio').dispatchEvent(new Event('change'));
  });

  await page.fill('#hsrGoPrice', '100');
  await page.fill('#hsrReturnPrice', '200');
  await page.fill('#busGoPrice', '50');
  await page.fill('#busReturnPrice', '60');

  await page.click('#saveRecordBtn');
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
     document.getElementById('btnList').click();
  });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const editBtns = document.querySelectorAll('.edit-record-btn');
    if(editBtns.length > 0) editBtns[0].click();
  });

  await page.waitForSelector('#recordModal', { state: 'visible' });
  await page.waitForTimeout(500);

  expect(await page.isChecked('#hsrRadio')).toBeTruthy();
  expect(await page.isChecked('#busRadio')).toBeTruthy();

  expect(await page.inputValue('#hsrGoPrice')).toBe('100');
  expect(await page.inputValue('#hsrReturnPrice')).toBe('200');
  expect(await page.inputValue('#busGoPrice')).toBe('50');
  expect(await page.inputValue('#busReturnPrice')).toBe('60');

  await page.click('#saveRecordBtn');
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const editBtns = document.querySelectorAll('.edit-record-btn');
    if(editBtns.length > 0) editBtns[0].click();
  });

  await page.waitForSelector('#recordModal', { state: 'visible' });
  await page.waitForTimeout(500);

  expect(await page.isChecked('#hsrRadio')).toBeTruthy();
  expect(await page.isChecked('#busRadio')).toBeTruthy();

  expect(await page.inputValue('#hsrGoPrice')).toBe('100');
  expect(await page.inputValue('#hsrReturnPrice')).toBe('200');
  expect(await page.inputValue('#busGoPrice')).toBe('50');
  expect(await page.inputValue('#busReturnPrice')).toBe('60');

  console.log("Edit modal functionality works flawlessly!");
});
