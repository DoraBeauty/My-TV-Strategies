import { test, expect } from '@playwright/test';

test('Test manual opening and closing in UI', async ({ page }) => {
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

  await page.evaluate(() => {
     document.getElementById('hsrRadio').checked = true;
     // don't dispatch change event because our new logic doesn't require it?
     // Oh wait, my problem was that the TEST wasn't clicking the checkboxes visually.
     // Let's actually click them.
  });

  // Checking radios is tricky natively, let's use the UI!
  await page.click('label[for="hsrRadio"]');
  await page.click('label[for="busRadio"]');

  await page.fill('#hsrGoPrice', '100');
  await page.fill('#hsrReturnPrice', '200');
  await page.fill('#busGoPrice', '50');
  await page.fill('#busReturnPrice', '60');

  // Submit
  await page.click('#saveRecordBtn');
  await page.waitForTimeout(2000); // wait for save and close

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

  console.log("HSR Checked:", await page.isChecked('#hsrRadio'));
  console.log("Bus Checked:", await page.isChecked('#busRadio'));
  console.log("HSR Go:", await page.inputValue('#hsrGoPrice'));
  console.log("HSR Return:", await page.inputValue('#hsrReturnPrice'));
  console.log("Bus Go:", await page.inputValue('#busGoPrice'));
  console.log("Bus Return:", await page.inputValue('#busReturnPrice'));
});
