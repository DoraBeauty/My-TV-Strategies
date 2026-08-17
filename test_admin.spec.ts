import { test, expect } from '@playwright/test';

test('Admin can see locations without ReferenceError', async ({ page }) => {
    await page.goto('http://localhost:8000');

    await page.evaluate(() => {
        const mockLocs = [
            { id: '1', name: 'Test Loc 1', region: '北部', userId: 'hephaestus161@gmail.com', createdAt: new Date().toISOString() },
            { id: '2', name: 'Other Loc 2', region: '中部', userId: 'other_456', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('guest_locations', JSON.stringify(mockLocs));
    });

    await page.click('#guestLoginBtn');
    await page.waitForTimeout(500);

    await page.evaluate(() => {
        window.firebaseData.currentUser.email = 'hephaestus161@gmail.com';
        window.currentUser = window.firebaseData.currentUser;

        const searchInput = document.getElementById('locationSearchInput');
        if (searchInput) {
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    await page.waitForTimeout(500);
    await page.click('label[for="btnMap"]');
    await page.waitForTimeout(500);

    // Expand the accordion so we can see the contents!
    await page.evaluate(() => {
        const buttons = document.querySelectorAll('.accordion-button.collapsed');
        buttons.forEach(btn => btn.click());
    });

    await page.waitForTimeout(500);

    await page.screenshot({ path: 'verification/screenshots/map_admin_fixed_expanded.png', fullPage: true });

    const count = await page.locator('.list-group-item').count();
    expect(count).toBe(2);

    const creatorText = await page.getByText('建立者: other_456').isVisible();
    expect(creatorText).toBeTruthy();
});
