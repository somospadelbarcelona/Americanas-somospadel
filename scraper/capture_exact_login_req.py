import json
from playwright.sync_api import sync_playwright

def capture_exact_req():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(locale="es-ES")

        captured = []
        def on_req(req):
            if "auth/login" in req.url:
                captured.append({
                    "url": req.url,
                    "method": req.method,
                    "headers": req.headers,
                    "post_data": req.post_data
                })

        page.on("request", on_req)

        page.goto("https://manager.playtomic.io/auth/login", wait_until="networkidle")
        try:
            btn = page.query_selector("button:has-text('Aceptar todo')")
            if btn: btn.click()
        except: pass

        page.fill("input[type='email']", "somospadeleugestion@gmail.com")
        page.fill("input[type='password']", "Factor2000!")

        for b in page.query_selector_all("button"):
            if "iniciar" in b.inner_text().lower():
                b.click()
                break

        import time
        time.sleep(3)

        print("Captured login requests:", len(captured))
        if captured:
            print("Headers:", json.dumps(captured[0]["headers"], indent=2))
            print("Post data:", captured[0]["post_data"])
            with open("scraper/exact_login_request.json", "w") as f:
                json.dump(captured, f, indent=2)

        browser.close()

if __name__ == "__main__":
    capture_exact_req()
