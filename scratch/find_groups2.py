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

        for division_label, division_text in [("M3 Masculina - Tercera", "Tercera"), ("M4 Masculina - Cuarta", "Cuarta")]:
            print(f"\n=== EXPLORANDO: {division_label} ===")
            
            # Click en la division usando el label completo "M3 Masculina - Tercera"
            clicked = await page.evaluate(f"""(label) => {{
                let els = Array.from(document.querySelectorAll('li, .mbsc-lv-item, div, span'));
                // Try exact match first
                let t = els.find(e => e.innerText && e.innerText.trim().includes(label));
                if (!t) {{
                    // Try just the division text
                    t = els.find(e => e.innerText && e.innerText.trim().includes(label.split(' - ')[1]));
                }}
                if (t) {{ t.click(); return t.innerText.trim(); }}
                return null;
            }}""", division_label)
            print(f"  Clic: {clicked}")
            await page.wait_for_timeout(2500)

            # Expand all collapsibles
            try:
                collapsibles = await page.query_selector_all(".mbsc-collapsible-header, .mbsc-lv-group-title")
                print(f"  Collapsibles encontrados: {len(collapsibles)}")
                for col in collapsibles:
                    await col.click()
                    await page.wait_for_timeout(200)
            except Exception as e:
                print(f"  Error expandiendo: {e}")
            await page.wait_for_timeout(1000)

            # Scroll down to load all groups
            for _ in range(5):
                await page.mouse.wheel(0, 500)
                await page.wait_for_timeout(400)
            
            # Get ALL list items
            items = await page.query_selector_all("li, .mbsc-lv-item")
            print(f"  Items encontrados: {len(items)}")
            for item in items:
                try:
                    text = (await item.inner_text()).strip()
                    text_clean = " ".join(text.split())
                    if text_clean and len(text_clean) > 2 and len(text_clean) < 120:
                        # Skip navigation/sponsor items
                        if any(skip in text_clean.lower() for skip in ["inform", "circuit", "lliga", "damm", "dunlop", "podoactiva", "nestea", "veri", "aneto", "wans", "diat", "mandala", "marae", "tibu"]):
                            continue
                        marker = " *** SOMOS PADEL ***" if contains_club(text_clean) else ""
                        print(f"  - {text_clean[:120]}{marker}")
                except:
                    pass
                    
            # Go back
            try:
                back = await page.query_selector(".mbsc-ic-arrow-left, .mbsc-ic-chevron-left")
                if back:
                    await back.click()
                    await page.wait_for_timeout(1500)
            except:
                await page.go_back()
                await page.wait_for_timeout(1500)

        await browser.close()
        print("\n[DONE]")

if __name__ == "__main__":
    asyncio.run(main())
