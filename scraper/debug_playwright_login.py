import json
import time
from playwright.sync_api import sync_playwright

def test_login_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="es-ES"
        )
        page = context.new_page()

        requests_logged = []
        def log_req(req):
            if "playtomic" in req.url:
                print(f"[REQ] {req.method} {req.url}")
                if req.post_data:
                    print(f"      POST DATA: {req.post_data[:200]}")
        def log_res(res):
            if "playtomic" in res.url:
                print(f"[RES] {res.status} {res.url}")
                try:
                    t = res.text()
                    if len(t) < 500:
                        print(f"      BODY: {t}")
                except Exception:
                    pass

        page.on("request", log_req)
        page.on("response", log_res)

        print("Navigating to login...")
        page.goto("https://app.playtomic.com/login", wait_until="networkidle")

        # Accept cookies
        try:
            accept_btn = page.query_selector("button:has-text('Accept All')") or page.query_selector("button:has-text('Aceptar')")
            if accept_btn:
                accept_btn.click()
                time.sleep(1)
        except Exception:
            pass

        page.fill("input[type='email']", "somospadeleugestion@gmail.com")
        page.fill("input[type='password']", "Factor2000!")

        print("Clicking submit...")
        page.click("button:has-text('Iniciar sesión')")

        # Wait 5 seconds
        time.sleep(5)
        page.screenshot(path="scraper/after_click.png")

        # Check for error text or url change
        print("Current URL:", page.url)
        content = page.content()
        for err in ["error", "incorrect", "contraseña", "inválid", "falló", "wrong"]:
            if err in content.lower():
                print(f"Keyword '{err}' found in page!")

        # Print all visible text
        body_text = page.inner_text("body")
        print("Body text snippet:\n", body_text[:1000])

        browser.close()

if __name__ == "__main__":
    test_login_flow()
