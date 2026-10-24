import time
from playwright.sync_api import sync_playwright

def do_google_signin():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ]
        )
        context = browser.new_context(locale="es-ES")
        page = context.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

        print("Navigating to Manager login...")
        page.goto("https://manager.playtomic.io/auth/login", wait_until="networkidle")

        # Remove cookie banner
        page.evaluate("document.querySelector('#usercentrics-cmp-ui')?.remove()")
        time.sleep(1)

        google_frame = None
        for f in page.frames:
            if "accounts.google.com/gsi/button" in f.url:
                google_frame = f
                break

        if not google_frame:
            print("Google frame not found!")
            browser.close()
            return

        with context.expect_page(timeout=15000) as popup_info:
            google_frame.click("div[role='button'], body", force=True)

        popup = popup_info.value
        popup.wait_for_load_state("networkidle")
        print("Popup opened!")

        print("Filling identifier somospadeleugestion@gmail.com...")
        popup.fill("#identifierId, input[name='identifier']", "somospadeleugestion@gmail.com")
        popup.click("button:has-text('Siguiente'), #identifierNext")

        time.sleep(4)
        popup.screenshot(path="scraper/google_step2.png")
        print("Step 2 URL:", popup.url)

        # Check if password field is available
        pwd_box = popup.query_selector("input[type='password'], input[name='Passwd']")
        if pwd_box:
            print("Password input found! Entering password...")
            pwd_box.fill("Factor2000!")
            popup.click("button:has-text('Siguiente'), #passwordNext")
            time.sleep(6)
            popup.screenshot(path="scraper/google_step3.png")
            print("Step 3 URL:", popup.url)
            print("Manager page URL:", page.url)
            page.screenshot(path="scraper/manager_after_google.png")
        else:
            print("Password input NOT found. Check scraper/google_step2.png")
            body = popup.inner_text("body")
            print("Text:", body[:300])

        browser.close()

if __name__ == "__main__":
    do_google_signin()
