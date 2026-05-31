import bs4

def main():
    try:
        html = open('scraper/dom_capture.html', encoding='utf-8').read()
        soup = bs4.BeautifulSoup(html, 'html.parser')
        
        print("--- BUSCANDO ITEMS .mbsc-lv-item ---")
        items = soup.select('.mbsc-lv-item')
        print(f"Total .mbsc-lv-item encontrados: {len(items)}")
        for i, item in enumerate(items[:30]):
            text = " | ".join([t.strip() for t in item.get_text("\n").split("\n") if t.strip()])
            print(f"Item {i}: {text}")
            
        print("\n--- BUSCANDO TABLAS O FILAS GENERALES ---")
        rows = soup.select('tr')
        print(f"Total filas 'tr' encontradas: {len(rows)}")
        for i, row in enumerate(rows[:30]):
            text = " | ".join([t.strip() for t in row.get_text("\n").split("\n") if t.strip()])
            print(f"Row {i}: {text}")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
