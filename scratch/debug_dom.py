import asyncio
from playwright.async_api import async_playwright

async def main():
    print("Dumping everything under Femenina - Cuarta...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()
        page.set_default_timeout(60000)
        
        await page.goto("https://summapadel.com/event/151", wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)
        
        # Click Femení tab
        await page.evaluate("""() => {
            let els = Array.from(document.querySelectorAll('label, li, span, button, a, .mbsc-segmented-item-text'));
            let f = els.find(e => e.innerText && e.innerText.trim().toLowerCase() === 'femení');
            if (f) f.click();
        }""")
        await page.wait_for_timeout(2000)
        
        # Click F4 Femenina - Cuarta
        await page.evaluate("""() => {
            let items = Array.from(document.querySelectorAll('li.mbsc-lv-item, .mbsc-listview-item'));
            let target = items.find(el => {
                let text = el.innerText.toLowerCase();
                return text.includes('f4') && text.includes('cuarta');
            });
            if (target) target.click();
        }""")
        await page.wait_for_timeout(3000)
        
        # Capture screenshot to see where we are
        await page.screenshot(path="scratch/screenshot_cuarta.png")
        print("Captured screenshot to scratch/screenshot_cuarta.png")
        
        # Get all text in body
        body_text = await page.inner_text("body")
        print("\n=== BODY TEXT (FIRST 1000 CHARACTERS) ===")
        print(body_text[:1000])
        
        # Check if there are specific lists
        list_items = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('.mbsc-lv-item, li, tr, td, th')).map(e => e.innerText.trim()).filter(t => t);
        }""")
        print(f"\nFound {len(list_items)} list items/elements.")
        print("\n=== FIRST 30 ELEMENTS ===")
        for idx, item in enumerate(list_items[:30]):
            print(f"  [{idx}]: {repr(item)}")
            
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
