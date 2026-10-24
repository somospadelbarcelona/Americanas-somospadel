import time
from playwright.sync_api import sync_playwright

def click_google():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox'
            ]
        )
        context = browser.new_context(locale="es-ES")
        page = context.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

        print("Navigating to Manager login...")
        page.goto("https://manager.playtomic.io/auth/login", wait_until="networkidle")

        # Remove cookie banner completely
        page.evaluate("""() => {
            const el = document.querySelector('#usercentrics-cmp-ui');
            if (el) el.remove();
        }""")
        time.sleep(1)

        # Find the google frame
        google_frame = None
        for f in page.frames:
            if "accounts.google.com/gsi/button" in f.url:
                google_frame = f
                break

        if google_frame:
            print("Found Google frame! Clicking button...")
            with context.expect_page(timeout=15000) as popup_info:
                # Force click or click inside frame
                google_frame.click("div[role='button'], body", force=True)

            popup = popup_info.value
            popup.wait_for_load_state("networkidle")
            print("Popup opened! URL:", popup.url)
            popup.screenshot(path="scraper/google_popup.png")

            # Fill email
            print("Filling email:", "somospadeleugestion@gmail.com")
            popup.fill("input[type='email']", "somospadeleugestion@gmail.com")
            popup.press("input[type='email']", "Enter")
            time.sleep(4)

            popup.screenshot(path="scraper/google_after_email.png")
            print("Popup URL after email:", popup.url)

            # Check if password input is visible or if blocked
            pwd_input = popup.query_selector("input[type='password']")
            if pwd_input:
                print("Password input found! Filling password...")
                pwd_input.fill("Factor2000!")
                popup.press("input[type='password']", "Enter")
                time.sleep(6)
                popup.screenshot(path="scraper/google_after_password.png")
                print("Popup URL after password:", popup.url)
            else:
                body = popup.inner_text("body")
                print("Body text in popup:\n", body[:400])

        browser.close()

if __name__ == "__main__":
    try:
        click_google()
    except Exception as e:
        print("Error:", e)
