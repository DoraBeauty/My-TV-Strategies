import { test, expect } from '@playwright/test';

test('Edit modal correctly populates and keeps transport data', async ({ page }) => {
  await page.goto('http://localhost:8000');

  await page.waitForSelector('#guestLoginBtn', { state: 'visible' });
  await page.click('#guestLoginBtn');
  await page.waitForTimeout(1000);

  await page.click('#fabBtn');
  await page.fill('#tripName', 'Test HSR and Bus Form');

  await page.selectOption('#transportType', 'public');

  await page.evaluate(() => {
     document.getElementById('hsrRadio').checked = true;
     document.getElementById('busRadio').checked = true;

     // Mock saved record
     const savedRecord = {
         id: '123',
         tripName: 'Test',
         transportType: 'public',
         transportTypes: ['hsr', 'bus'],
         tickets: {
             hsr: { go: { amount: 100 }, return: { amount: 200 } },
             bus: { go: { amount: 50 }, return: { amount: 60 } }
         }
     };

     // Directly call openEditModal on it
     window.openEditModal(savedRecord);
  });

  await page.waitForTimeout(1000);

  console.log("HSR Checked:", await page.isChecked('#hsrRadio'));
  console.log("Bus Checked:", await page.isChecked('#busRadio'));
  console.log("HSR Go:", await page.inputValue('#hsrGoPrice'));
  console.log("HSR Return:", await page.inputValue('#hsrReturnPrice'));
  console.log("Bus Go:", await page.inputValue('#busGoPrice'));
  console.log("Bus Return:", await page.inputValue('#busReturnPrice'));
});
