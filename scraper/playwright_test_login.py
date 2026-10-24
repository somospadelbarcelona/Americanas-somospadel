import json
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="es-ES"
        )
        page = context.new_page()

        captured_requests = []
        captured_responses = []

        def on_request(request):
            if "playtomic" in request.url:
                captured_requests.append({
                    "url": request.url,
                    "method": request.method,
                    "headers": request.headers
                })

        def on_response(response):
            if "playtomic" in response.url and ("team" in response.url or "tournament" in response.url or "auth" in response.url or "participant" in response.url):
                try:
                    text = response.text()
                    captured_responses.append({
                        "url": response.url,
                        "status": response.status,
                        "body": text[:1000]
                    })
                except Exception:
                    pass

        page.on("request", on_request)
        page.on("response", on_response)

        print("Navigating to login page...")
        page.goto("https://app.playtomic.com/login", wait_until="networkidle", timeout=30000)
        page.screenshot(path="scraper/login_page.png")
        print("Page title:", page.title())

        # Check what inputs are on the page
        inputs = page.query_selector_all("input")
        print(f"Found {len(inputs)} input elements:")
        for inp in inputs:
            print("  Input:", inp.get_attribute("type"), inp.get_attribute("name"), inp.get_attribute("placeholder"))

        # Check buttons
        buttons = page.query_selector_all("button")
        print(f"Found {len(buttons)} buttons:")
        for btn in buttons:
            print("  Button:", btn.inner_text())

        browser.close()

if __name__ == "__main__":
    run()
