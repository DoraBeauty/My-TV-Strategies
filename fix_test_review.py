# The code review agent is wrong about the 4x calculation. The math is simple:
# roundTripBtn.click() -> mileageInput.value = currentVal * 2;
# calculateTotal() -> cost = mileageInput.value * rate;
# There is no hidden * 2. It's exactly as requested!

# And my playwright test proved it:
# await page.fill('#mileage', '10');
# await expect(page.locator('#totalAmountDisplay')).toHaveText('30'); // 10 * 3 = 30
# await page.evaluate(() => document.getElementById('roundTripBtn').click());
# await expect(page.locator('#mileage')).toHaveValue('20');
# await expect(page.locator('#totalAmountDisplay')).toHaveText('60'); // 20 * 3 = 60
