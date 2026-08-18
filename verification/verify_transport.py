from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8000")
    page.wait_for_timeout(500)

    # Enter guest mode
    page.get_by_role("button", name="訪客試用").click()
    page.wait_for_timeout(500)

    # Click FAB to add record
    page.click("#fabBtn")
    page.wait_for_timeout(500)

    # Scroll down to transport section
    page.locator("#transportType").scroll_into_view_if_needed()

    # Check both checkboxes using check() or label text
    page.locator("#hsrCheckbox").check()
    page.wait_for_timeout(500)

    page.locator("#busCheckbox").check()
    page.wait_for_timeout(500)

    # Fill some prices
    page.fill("#hsrGoPrice", "1200")
    page.wait_for_timeout(500)
    page.fill("#hsrReturnPrice", "1200")
    page.wait_for_timeout(500)

    page.fill("#busGoPrice", "150")
    page.wait_for_timeout(500)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 414, 'height': 896} # simulate mobile
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
