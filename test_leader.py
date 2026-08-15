from playwright.sync_api import sync_playwright
import time
import os

def test():
    if not os.path.exists("screenshots"):
        os.makedirs("screenshots")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        page.goto("http://localhost:8000")
        page.wait_for_timeout(1000)

        mock_data = '''[{"id":"mock2","tripName":"Test Leader Trip","leader":"Captain America","isSettled":false,"totalAmount":200,"startTime":"2023-10-01T08:00","endTime":"2023-10-01T12:00"}]'''
        page.evaluate(f"localStorage.setItem('guest_records', '{mock_data}')")

        page.goto("http://localhost:8000")
        page.wait_for_timeout(1000)

        page.click("button:has-text('訪客試用')")
        page.wait_for_timeout(1000)

        page.screenshot(path="screenshots/leader_card.png")

        # Click Edit
        page.click(".edit-record-btn")
        page.wait_for_timeout(1000)

        page.screenshot(path="screenshots/leader_edit.png")

        browser.close()

if __name__ == "__main__":
    test()
