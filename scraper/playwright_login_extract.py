import json
import time
from playwright.sync_api import sync_playwright

def login_and_fetch():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="es-ES"
        )
        page = context.new_page()

        api_calls = []

        def handle_response(response):
            url = response.url
            if any(k in url for k in ["team", "tournament", "auth", "participant", "registration", "user"]):
                try:
                    text = response.text()
                    api_calls.append({
                        "url": url,
                        "status": response.status,
                        "data": text
                    })
                    print(f"[API RESPONSE] {url} [{response.status}] len={len(text)}")
                except Exception:
                    pass

        page.on("response", handle_response)

        print("Opening login page...")
        page.goto("https://app.playtomic.com/login", wait_until="networkidle", timeout=30000)

        # Accept cookies if popup is present
        try:
            accept_btn = page.query_selector("button:has-text('Accept All')") or page.query_selector("button:has-text('Aceptar')")
            if accept_btn:
                print("Clicking accept cookies...")
                accept_btn.click()
                time.sleep(1)
        except Exception as e:
            print("Cookie banner error:", e)

        print("Filling credentials...")
        page.fill("input[type='email']", "somospadeleugestion@gmail.com")
        page.fill("input[type='password']", "Factor2000!")

        print("Clicking 'Iniciar sesión'...")
        # Submit form
        with page.expect_navigation(timeout=15000):
            page.click("button:has-text('Iniciar sesión')")

        print("Post-login URL:", page.url)
        page.screenshot(path="scraper/post_login.png")

        # Now save storage state (cookies, local storage)
        context.storage_state(path="scraper/playtomic_browser_state.json")
        print("Storage state saved!")

        # Navigate to tournament page
        tournament_url = "https://app.playtomic.com/tournaments/46011a01-68b4-433f-b2e3-581ca5fabfdb"
        print(f"Navigating to {tournament_url} ...")
        page.goto(tournament_url, wait_until="networkidle", timeout=30000)
        page.screenshot(path="scraper/tournament_after_login.png")

        content = page.content()
        with open("scraper/tournament_logged_in.html", "w", encoding="utf-8") as f:
            f.write(content)
        print("Tournament page saved, length:", len(content))

        with open("scraper/captured_api_calls.json", "w", encoding="utf-8") as f:
            json.dump(api_calls, f, indent=2)

        browser.close()

if __name__ == "__main__":
    try:
        login_and_fetch()
    except Exception as e:
        print("Exception:", e)
