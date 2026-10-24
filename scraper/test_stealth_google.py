import time
from playwright.sync_api import sync_playwright

def test_google_login():
    with sync_playwright() as p:
        # Launch browser stealthily
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1280,800'
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="es-ES"
        )
        page = context.new_page()

        # Remove navigator.webdriver flag
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)

        print("Navigating to Manager login...")
        page.goto("https://manager.playtomic.io/auth/login", wait_until="networkidle")

        # Accept cookies if any
        try:
            b = page.query_selector("button:has-text('Aceptar todo')")
            if b: b.click()
        except: pass

        # Look for Google Sign-In button or iframe
        print("Looking for Google Sign-In...")
        page.screenshot(path="scraper/manager_login_screen.png")

        # Let's see all iframes and buttons
        for frame in page.frames:
            print("Frame URL:", frame.url)
            g_btn = frame.query_selector("div[role='button']") or frame.query_selector("span:has-text('Google')")
            if g_btn:
                print("Found Google button in frame:", frame.url)

        browser.close()

if __name__ == "__main__":
    test_google_login()
