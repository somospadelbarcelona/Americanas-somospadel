import time
from playwright.sync_api import sync_playwright

emails = [
    "somospadeleugestion@gmail.com",
    "somospadel.eu@gmail.com",
    "somospadelbarcelona@gmail.com",
    "somospadeleuspain@gmail.com"
]

passwords = [
    "Factor2000!",
    "Jaraba99!",
    "Jaraba99",
    "Optima2025!",
    "SersomospadelCos2025!@"
]

def test_combinations():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(locale="es-ES")
        page = context.new_page()

        print("Navigating to login...")
        page.goto("https://app.playtomic.com/login", wait_until="networkidle")
        try:
            accept = page.query_selector("button:has-text('Accept All')")
            if accept: accept.click()
        except: pass

        for email in emails:
            for pwd in passwords:
                print(f"Testing {email} with pwd {pwd[:4]}*** ...")
                page.fill("input[type='email']", email)
                page.fill("input[type='password']", pwd)
                page.click("button:has-text('Iniciar sesión')")
                time.sleep(2.5)

                if "/login" not in page.url:
                    print(f"\n🎉🎉🎉 SUCCESSFUL LOGIN! Email: {email} | Pwd: {pwd} | URL: {page.url} 🎉🎉🎉")
                    context.storage_state(path="scraper/playtomic_authenticated_state.json")
                    browser.close()
                    return (email, pwd)
                else:
                    # check error
                    content = page.content()
                    if "incorrect" not in content.lower():
                        print("  Something different happened! URL:", page.url)

        browser.close()
    return None

if __name__ == "__main__":
    res = test_combinations()
    print("Result:", res)
