import os
import json
import time
from playwright.sync_api import sync_playwright

chrome_exe = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\Application\chrome.exe'
user_data_dir = r'C:\Users\acoscolin\OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio\ALEX\AMERICANAS\scraper\chrome_clone'

def inspect_with_cloned_profile():
    with sync_playwright() as p:
        print("Launching Chrome with cloned profile...")
        context = p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            executable_path=chrome_exe,
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox'
            ]
        )
        page = context.new_page()

        api_responses = []
        def on_response(res):
            url = res.url
            if any(k in url for k in ['playtomic', 'tournament', 'team', 'participant', 'schedule', 'booking', 'match']):
                try:
                    t = res.text()
                    api_responses.append({"url": url, "status": res.status, "data": t})
                    print(f"[NET] {url} -> {res.status} (len {len(t)})")
                except:
                    pass

        page.on("response", on_response)

        # 1. Try Playtomic Manager URL
        manager_url = "https://manager.playtomic.io/dashboard/schedule/f58f8078-f156-454e-9b4f-d12ad00c0d90?tid=bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"
        print(f"Navigating to Manager: {manager_url}")
        try:
            page.goto(manager_url, wait_until="networkidle", timeout=25000)
            page.screenshot(path="scraper/manager_page.png")
            print("Manager page title:", page.title())
            print("Manager final URL:", page.url)
            with open("scraper/manager_dump.html", "w", encoding="utf-8") as f:
                f.write(page.content())
        except Exception as e:
            print("Manager nav error:", e)

        # 2. Try Tournament App URL
        tournament_url = "https://app.playtomic.com/tournaments/46011a01-68b4-433f-b2e3-581ca5fabfdb"
        print(f"\nNavigating to Tournament: {tournament_url}")
        try:
            page.goto(tournament_url, wait_until="networkidle", timeout=25000)
            page.screenshot(path="scraper/tournament_page_cloned.png")
            print("Tournament page title:", page.title())
            print("Tournament final URL:", page.url)
            with open("scraper/tournament_cloned_dump.html", "w", encoding="utf-8") as f:
                f.write(page.content())
        except Exception as e:
            print("Tournament nav error:", e)

        with open("scraper/cloned_api_responses.json", "w", encoding="utf-8") as f:
            json.dump(api_responses, f, indent=2)

        context.close()

if __name__ == '__main__':
    inspect_with_cloned_profile()
