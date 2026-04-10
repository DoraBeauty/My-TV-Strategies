from playwright.sync_api import sync_playwright
import threading
import http.server
import socketserver
import time

PORT = 8010
Handler = http.server.SimpleHTTPRequestHandler

def serve():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=serve, daemon=True)
server_thread.start()
time.sleep(1)

def test_frontend_renders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Check if basic elements render correctly
        page.wait_for_selector('h1:has-text("跨平台 限免遊戲追蹤")')
        page.wait_for_selector('#customStoreDropdown')

        # Test Calendar Modal
        page.locator("#openCalendarBtn").click()
        page.wait_for_selector('#calendarModal:not(.hidden)')
        page.locator("#closeCalendarBtn").click()
        page.wait_for_selector('#calendarModal', state='hidden')

        # Open Dropdown
        page.locator("#storeDropdownBtn").click()
        page.wait_for_selector('#storeDropdownMenu:not(.hidden)')

        # Test clicking an option
        page.locator(".store-option[data-value='1']").click()

        # Verify hidden input changed
        value = page.locator("#storeFilter").input_value()
        assert value == "1"

        # Verify grid exists (even if hidden due to API slowness)
        assert page.locator('#gamesGrid').count() == 1

        browser.close()
