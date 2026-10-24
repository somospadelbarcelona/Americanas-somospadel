import time
import json
from playwright.sync_api import sync_playwright

def login_manager():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(locale="es-ES")
        page = context.new_page()

        api_logs = []
        def on_response(res):
            url = res.url
            if any(k in url for k in ['auth', 'tenant', 'schedule', 'tournament', 'participant', 'player', 'session', 'token']):
                try:
                    t = res.text()
                    api_logs.append({"url": url, "status": res.status, "data": t[:500]})
                    print(f"[API] {url} [{res.status}] len={len(t)}")
                except:
                    pass

        page.on("response", on_response)

        target_url = "https://manager.playtomic.io/dashboard/schedule/f58f8078-f156-454e-9b4f-d12ad00c0d90?tid=bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"
        login_url = f"https://manager.playtomic.io/auth/login?return_to={target_url}&tid=bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"

        print("Opening Manager login page...")
        page.goto(login_url, wait_until="networkidle")

        # Accept cookies
        try:
            accept_btn = page.query_selector("button:has-text('Aceptar todo')") or page.query_selector("button:has-text('Accept')")
            if accept_btn:
                print("Accepting cookies...")
                accept_btn.click()
                time.sleep(1)
        except Exception as e:
            print("Cookie error:", e)

        print("Filling credentials in Manager...")
        page.fill("input[type='email']", "somospadeleugestion@gmail.com")
        page.fill("input[type='password']", "Factor2000!")

        print("Clicking 'Iniciar sesión'...")
        # Find the submit button (not the Google one, the one inside the form or matching text)
        buttons = page.query_selector_all("button")
        submit_btn = None
        for b in buttons:
            if "iniciar" in b.inner_text().lower():
                submit_btn = b

        if submit_btn:
            submit_btn.click()
        else:
            page.press("input[type='password']", "Enter")

        # Wait for navigation or error
        print("Waiting 10s for response...")
        time.sleep(10)

        print("Current URL:", page.url)
        page.screenshot(path="scraper/manager_after_submit.png")

        # Check body text
        body = page.inner_text("body")
        print("Body text snippet after submit:\n", body[:600])

        with open("scraper/manager_post_submit.html", "w", encoding="utf-8") as f:
            f.write(page.content())

        # If logged in successfully, save state
        if "/dashboard" in page.url or "/schedule" in page.url:
            print(">>> LOGIN SUCCESSFUL IN PLAYTOMIC MANAGER! <<<")
            context.storage_state(path="scraper/manager_storage_state.json")

        with open("scraper/manager_api_logs.json", "w", encoding="utf-8") as f:
            json.dump(api_logs, f, indent=2)

        browser.close()

if __name__ == "__main__":
    login_manager()
