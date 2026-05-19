import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

CLUB_KEYWORDS = ["somos", "padel bcn", "somopadel", "somospadel"]

def contains_club(text):
    tl = text.lower()
    return any(kw in tl for kw in CLUB_KEYWORDS)

async def main():
    print("Iniciando...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        page = await browser.new_page()
        page.set_default_timeout(20000)
        
        await page.goto("https://summapadel.com/event/151", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Click Masculina
        print("[1] Haciendo clic en Masculina...")
        await page.evaluate("""() => {
            let labels = Array.from(document.querySelectorAll('label, .mbsc-segmented-item, div, span'));
            let t = labels.find(e => e.innerText && (e.innerText.trim() === 'Masculina' || e.innerText.trim() === 'Masculí'));
            if (t) t.click();
        }""")
        await page.wait_for_timeout(2000)

        for division in ["Tercera", "Cuarta"]:
            print(f"\n=== EXPLORANDO DIVISION: {division} ===")
            
            # Click en la division
            clicked = await page.evaluate(f"""(div) => {{
                let els = Array.from(document.querySelectorAll('li, .mbsc-lv-item, div, span'));
                let t = els.find(e => e.innerText && e.innerText.trim() === div);
                if (!t) t = els.find(e => e.innerText && e.innerText.trim().includes(div));
                if (t) {{ t.click(); return true; }}
                return false;
            }}""", division)
            print(f"  Clic en {division}: {clicked}")
            await page.wait_for_timeout(2000)

            # Expand collapsibles
            try:
                collapsibles = await page.query_selector_all(".mbsc-collapsible-header, .mbsc-lv-group-title")
                for col in collapsibles:
                    await col.click()
                    await page.wait_for_timeout(200)
            except:
                pass
            await page.wait_for_timeout(1000)
            
            # Get ALL list items
            items = await page.query_selector_all("li, .mbsc-lv-item")
            print(f"  Total items encontrados: {len(items)}")
            for item in items:
                try:
                    text = (await item.inner_text()).strip()
                    text_clean = " ".join(text.split())
                    if text_clean and len(text_clean) > 1:
                        # Mark teams from our club
                        marker = " *** SOMOS PADEL ***" if contains_club(text_clean) else ""
                        print(f"  - {text_clean[:100]}{marker}")
                except:
                    pass

        await browser.close()
        print("\n[DONE]")

if __name__ == "__main__":
    asyncio.run(main())
