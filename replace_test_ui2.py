import re

with open('test_ui.spec.ts', 'r') as f:
    content = f.read()

# Let's fix the test logic to handle Bootstrap modal transitions properly. Wait for transition to finish before clicking fabBtn.
content = content.replace(
"""  await page.locator('#equipmentSettingsModal button:has-text("完成")').click();
  await page.waitForSelector('#equipmentSettingsModal', { state: 'hidden' });

  // Test Record Modal
  await page.click('#fabBtn', { force: true });
  await page.waitForSelector('#recordModal', { state: 'visible' });""",
"""  await page.locator('#equipmentSettingsModal button:has-text("完成")').click();
  await page.waitForSelector('#equipmentSettingsModal', { state: 'hidden' });

  await page.waitForTimeout(1000);
  // Test Record Modal
  await page.click('#fabBtn', { force: true });
  await page.waitForSelector('#recordModal', { state: 'visible' });"""
)

with open('test_ui.spec.ts', 'w') as f:
    f.write(content)
