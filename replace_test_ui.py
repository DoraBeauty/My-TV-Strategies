import re

with open('test_ui.spec.ts', 'r') as f:
    content = f.read()

# Add test code to verify Settings Logic!
test_settings_logic = """
  // Test Equipment Settings logic
  await page.click('#mobileMenuBtn');
  await page.click('text="驗證裝備設定"');
  await page.waitForSelector('#equipmentSettingsModal', { state: 'visible' });

  // Verify default groups exist
  await expect(page.locator('#equipmentSettingsContent')).toContainText('迫砲');
  await expect(page.locator('#equipmentSettingsContent')).toContainText('60迫砲');

  // Verify creating a group works
  // We mock window.prompt to return a string "TestGroup"
  await page.evaluate(() => {
    window.prompt = () => "TestGroup";
  });
  await page.click('#addEquipmentGroupBtn');
  await expect(page.locator('#equipmentSettingsContent')).toContainText('TestGroup');

  // Verify adding an item works
  await page.evaluate(() => {
    window.prompt = () => "TestItem";
  });
  // Click the first "新增裝備種類" button (which adds to the first group)
  await page.locator('button:has-text("新增裝備種類")').first().click();
  await expect(page.locator('#equipmentSettingsContent')).toContainText('TestItem');

  // Close Settings Modal
  await page.locator('#equipmentSettingsModal .btn-primary').click(); // 完成 button
  await page.waitForSelector('#equipmentSettingsModal', { state: 'hidden' });

  await page.click('#fabBtn', { force: true });
  await page.waitForSelector('#recordModal', { state: 'visible' });

  await page.click('#openEquipmentModalBtn', { force: true });
  await page.waitForSelector('#equipmentModal', { state: 'visible' });
"""

# Let's completely rewrite the test to make it simple and test the new logic
new_test_ui = """
import { test, expect } from '@playwright/test';

test('verify JS logic changes', async ({ page }) => {
  await page.goto('http://localhost:8000');

  await page.waitForTimeout(2000);

  const loginVisible = await page.locator('#guestLoginBtn').isVisible();
  if (loginVisible) {
      await page.click('#guestLoginBtn');
  }

  await page.evaluate(() => {
     document.getElementById('loginView').style.display = 'none';
     document.getElementById('dashboardView').style.display = 'block';
  });

  // Test Settings Modal
  await page.click('#mobileMenuBtn');
  await page.click('text="驗證裝備設定"');
  await page.waitForSelector('#equipmentSettingsModal', { state: 'visible' });

  await expect(page.locator('#equipmentSettingsContent')).toContainText('迫砲');

  await page.evaluate(() => { window.prompt = () => "TestGroup"; });
  await page.click('#addEquipmentGroupBtn');
  await expect(page.locator('#equipmentSettingsContent')).toContainText('TestGroup');

  await page.evaluate(() => { window.prompt = () => "TestItem"; });
  await page.locator('button:has-text("新增裝備種類")').last().click();
  await expect(page.locator('#equipmentSettingsContent')).toContainText('TestItem');

  await page.locator('#equipmentSettingsModal button:has-text("完成")').click();
  await page.waitForSelector('#equipmentSettingsModal', { state: 'hidden' });

  // Test Record Modal
  await page.click('#fabBtn', { force: true });
  await page.waitForSelector('#recordModal', { state: 'visible' });

  await page.click('#openEquipmentModalBtn', { force: true });
  await page.waitForSelector('#equipmentModal', { state: 'visible' });

  await page.fill('input[data-name="105榴砲"]', '2');
  await page.fill('input[data-name="TestItem"]', '1');

  await expect(page.locator('#modalEquipmentTotalQty')).toHaveText('3');

  await page.evaluate(() => document.getElementById('confirmEquipmentBtn').click());
  await page.waitForSelector('#equipmentModal', { state: 'hidden' });

  await expect(page.locator('#equipmentSummary')).toContainText('105榴砲×2、TestItem×1（共 3 門）');

});
"""

with open('test_ui.spec.ts', 'w') as f:
    f.write(new_test_ui)
