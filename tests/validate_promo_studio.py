import os
import re
import sys

def main():
    studio_path = "promo-studio.html"
    if not os.path.exists(studio_path):
        print("ERROR: promo-studio.html does not exist!")
        sys.exit(1)

    with open(studio_path, "r", encoding="utf-8") as f:
        html = f.read()

    print(f"Read promo-studio.html ({len(html)} bytes)")

    # 1. Search for img tags or asset references
    img_tags = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    print("Found img src tags:", img_tags)

    # 2. Search for any asset paths in JS or CSS
    asset_matches = re.findall(r'["\'](img/[^"\']+)["\']', html)
    print("Found img/* paths in file:", set(asset_matches))

    # Check existence of these img assets
    for asset in set(img_tags + asset_matches):
        exists = os.path.exists(asset)
        print(f"  Asset: '{asset}' -> Exists: {exists}")

    # 3. Check all IDs queried by getElementById in JS
    js_ids = re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', html)
    print(f"Total getElementById queries in JS: {len(js_ids)}")
    unique_js_ids = sorted(list(set(js_ids)))

    missing_ids = []
    for el_id in unique_js_ids:
        # Check if id="el_id" exists in html
        pattern = rf'id=["\']{re.escape(el_id)}["\']'
        if not re.search(pattern, html):
            missing_ids.append(el_id)

    if missing_ids:
        print("ERROR: Missing DOM IDs referenced in JS:")
        for m in missing_ids:
            print(f"  - {m}")
    else:
        print("SUCCESS: All getElementById IDs exist in the HTML DOM!")

    # 4. Check querySelector / querySelectorAll in JS
    query_selectors = re.findall(r'querySelectorAll\(["\']([^"\']+)["\']\)', html)
    print("querySelectorAll selectors:", set(query_selectors))

if __name__ == "__main__":
    main()
