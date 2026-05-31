import asyncio
import re
from playwright.async_api import async_playwright

async def click_tab_robust(page, terms):
    for term in terms:
        try:
            handle = await page.evaluate_handle(f"""(term) => {{
                let elements = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div'));
                let candidates = elements.filter(e => {{
                    let isVisible = e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0;
                    return isVisible && e.innerText && e.innerText.trim().toLowerCase().includes(term.toLowerCase());
                }});
                if (candidates.length > 0) {{
                    candidates.sort((a, b) => a.innerText.trim().length - b.innerText.trim().length);
                    return candidates[0];
                }}
                return null;
            }}""", term)
            
            element = handle.as_element()
            if element:
                await element.click()
                await page.wait_for_timeout(1500)
                return True
        except Exception as e:
            print(f"Error click_tab_robust: {e}")
    return False

async def main():
    print("Iniciando prueba de scraping de clasificaciones...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()
        page.set_default_timeout(60000)
        
        url = "https://summapadel.com/event/151"
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)
        
        # Clicar Masculina
        await click_tab_robust(page, ["Masculí", "Masculina"])
        await page.wait_for_timeout(1500)
        
        # Clicar Tercera
        elements = await page.query_selector_all("li, .mbsc-lv-item")
        target_element = None
        for el in elements:
            if not await el.is_visible():
                continue
            text = (await el.inner_text()).replace('\n', ' ').strip().lower()
            if "m3" in text or "tercera" in text:
                target_element = el
                break
        
        if target_element:
            await target_element.scroll_into_view_if_needed()
            await target_element.click()
            await page.wait_for_timeout(2500)
            
            # Clicar Grupo "3MB FASE 2 G3"
            items = await page.query_selector_all("li, .mbsc-lv-item, .mbsc-grid-col")
            target_grp_el = None
            for item in items:
                if await item.is_visible():
                    text = (await item.inner_text()).replace('\n', ' ').strip().lower()
                    if "3mb fase 2 g3" in text:
                        target_grp_el = item
                        break
            
            if target_grp_el:
                await target_grp_el.scroll_into_view_if_needed()
                await target_grp_el.click()
                await page.wait_for_timeout(2500)
                
                # Clicar pestaña Classificació
                await click_tab_robust(page, ["Classificació", "Classificación", "Standing"])
                await page.wait_for_timeout(2000)
                
                # Imprimir el inner_text de todas las filas .mbsc-lv-item
                rows = await page.query_selector_all(".mbsc-lv-item")
                print(f"Encontradas {len(rows)} filas en Clasificación:")
                for idx, row in enumerate(rows):
                    text = await row.inner_text()
                    print(f"--- FILA {idx+1} ---")
                    print(text)
                    print("-" * 20)
            else:
                print("Grupo no encontrado")
        else:
            print("División no encontrada")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
