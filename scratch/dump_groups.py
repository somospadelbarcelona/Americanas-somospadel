import asyncio
import os
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

async def click_tab_robust(page, terms):
    for term in terms:
        try:
            success = await page.evaluate(f"""(term) => {{
                let labels = Array.from(document.querySelectorAll('label, .mbsc-segmented-item, div, span'));
                let target = labels.find(e => e.innerText && e.innerText.trim().toLowerCase() === term.toLowerCase());
                if (!target) {{
                    target = labels.find(e => e.innerText && e.innerText.trim().toLowerCase().includes(term.toLowerCase()));
                }}
                if (target) {{
                    target.click();
                    return true;
                }}
                return false;
            }}""", term)
            if success:
                await page.wait_for_timeout(1000)
                return True
        except Exception:
            pass
    return False

async def smooth_scroll_and_find(page, text_to_find, element_selector="*"):
    for _ in range(15):
        found = await page.evaluate(f"""(args) => {{
            let els = Array.from(document.querySelectorAll(args[1]));
            let candidates = els.filter(e => e.innerText && e.innerText.trim().includes(args[0]));
            if (candidates.length > 0) {{
                candidates.sort((a, b) => a.innerText.length - b.innerText.length);
                candidates[0].scrollIntoView({{behavior: 'smooth', block: 'center'}});
                return true;
            }}
            return false;
        }}""", [text_to_find, element_selector])
        
        if found:
            await page.wait_for_timeout(800)
            return True
        await page.mouse.wheel(0, 400)
        await page.wait_for_timeout(300)
    return False

async def click_element_by_text(page, text_to_find, element_selector="*"):
    success = await page.evaluate(f"""(args) => {{
        let els = Array.from(document.querySelectorAll(args[1]));
        let candidates = els.filter(e => e.innerText && e.innerText.trim().includes(args[0]));
        if (candidates.length > 0) {{
            candidates.sort((a, b) => a.innerText.length - b.innerText.length);
            candidates[0].click();
            return true;
        }}
        return false;
    }}""", [text_to_find, element_selector])
    return success

async def main():
    print("Iniciando Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        page = await browser.new_page()
        page.set_default_timeout(15000)
        
        await page.goto("https://summapadel.com/event/151", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        # 1. Seleccionar Masculina/Femenina
        print("Haciendo clic en Masculina...")
        await click_tab_robust(page, ["Masculí", "Masculina"])
        await page.wait_for_timeout(1000)

        # 2. Imprimir Tercera
        print("\nAbriendo Tercera...")
        await click_element_by_text(page, "Tercera", "li, .mbsc-lv-item")
        await page.wait_for_timeout(2000)
        
        print("Grupos en Tercera:")
        items = await page.query_selector_all(".mbsc-lv-item, .mbsc-collapsible-header")
        for item in items:
            text = await item.inner_text()
            print(text.strip().replace('\\n', ' '))
            
        print("\nAbriendo Cuarta...")
        await click_element_by_text(page, "Cuarta", "li, .mbsc-lv-item")
        await page.wait_for_timeout(2000)
        
        print("Grupos en Cuarta:")
        items = await page.query_selector_all(".mbsc-lv-item, .mbsc-collapsible-header")
        for item in items:
            text = await item.inner_text()
            print(text.strip().replace('\\n', ' '))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
