"""
=============================================================
 BOT CAZARRECOMPENSAS v4 FINAL - SOMOS PADEL BCN
 Selector: div.div-text-short-categoria (selector real DOM)
=============================================================
"""
import asyncio
import os
import json
import re
import sys
from playwright.async_api import async_playwright

# Forzar salida inmediata en entornos non-interactive
sys.stdout.reconfigure(line_buffering=True)

TARGET_URL = "https://summapadel.com/event/151"
CLUB_KEYWORDS = ["somos", "padel bcn", "somopadel", "somospadel"]
OUTPUT_JS = os.path.join(os.getcwd(), "scraper", "teams_data_auto.js")

# Divisiones del menu a rastrear - TODAS LAS CATEGORÍAS
DIVISIONS = [
    # MASCULINA
    {"text": "Masculina - Primera",   "cat": "Masculina"},
    {"text": "Masculina - Segunda",   "cat": "Masculina"},
    {"text": "Masculina - Tercera",   "cat": "Masculina"},
    {"text": "Masculina - Cuarta",    "cat": "Masculina"},
    {"text": "Masculina - Senior+45", "cat": "Masculina"},
    # FEMENINA
    {"text": "Femenina - Primera",   "cat": "Femenina"},
    {"text": "Femenina - Segunda",   "cat": "Femenina"},
    {"text": "Femenina - Tercera",   "cat": "Femenina"},
    {"text": "Femenina - Cuarta",    "cat": "Femenina"},
    # MIXTA
    {"text": "Mixta - Primera",      "cat": "Mixta"},
    {"text": "Mixta - Segunda",      "cat": "Mixta"},
    {"text": "Mixta - Tercera",      "cat": "Mixta"},
    {"text": "Mixta - Quarta",       "cat": "Mixta"},
]

found_teams = []


def slug(name):
    return re.sub(r'[^a-z0-9]', '-', name.lower()).strip('-')


def contains_club(text):
    tl = text.lower()
    return any(kw in tl for kw in CLUB_KEYWORDS)


async def scrape_group(page, cat, division, group_name):
    """Dentro de un grupo concreto: lee la tabla y equipo del club"""
    await page.wait_for_timeout(3000)
    
    # Capturar todo el texto visible para detectar al club
    page_text = await page.evaluate("() => document.body.innerText")
    if not contains_club(page_text):
        return None

    print(f"         [CAZADO] Club detectado en grupo {group_name}")

    # === Nombre del equipo ===
    # El equipo suele estar en label.three-lines.mbsc-txt-s
    team_els = await page.query_selector_all("label.three-lines.mbsc-txt-s, .mbsc-listview-item-text")
    team_name = None
    for tel in team_els:
        txt = (await tel.inner_text()).strip()
        if contains_club(txt):
            team_name = txt
            break

    if not team_name:
        team_name = f"SOMOS PADEL BCN ({division})"

    # === Standings (Clasificación) ===
    standings = []
    # Intentamos buscar el tab de Clasificación si existe
    try:
        clasif_tab = page.get_by_text("Clasificació", exact=False)
        if await clasif_tab.is_visible():
            await clasif_tab.click()
            await page.wait_for_timeout(2000)
    except:
        pass

    rows = await page.query_selector_all("tr, .mbsc-grid-row")
    for i, row in enumerate(rows):
        cell_texts = [(await c.inner_text()).strip() for c in await row.query_selector_all("td, .mbsc-grid-col")]
        if not cell_texts or len(cell_texts) < 2:
            continue
            
        name_cell = cell_texts[0]
        if not name_cell or "Pos" in name_cell or "Equip" in name_cell:
            continue

        def safe_int(val):
            try:
                return int(re.search(r'\d+', str(val)).group())
            except:
                return 0

        standings.append({
            "pos": i,
            "team": name_cell,
            "pj": safe_int(cell_texts[1]) if len(cell_texts) > 1 else 0,
            "pg": safe_int(cell_texts[2]) if len(cell_texts) > 2 else 0,
            "pp": safe_int(cell_texts[3]) if len(cell_texts) > 3 else 0,
            "df": 0,
            "pts": safe_int(cell_texts[-1]) if cell_texts else 0,
            **({"isCurrent": True} if contains_club(name_cell) else {})
        })

    # === Schedule (Próximos partidos y RESULTADOS) ===
    schedule = []
    # Volver a la pestaña de Partidos si nos movimos
    try:
        matches_tab = page.get_by_text("Partits", exact=False)
        if await matches_tab.is_visible():
            await matches_tab.click()
            await page.wait_for_timeout(2000)
    except:
        pass

    match_els = await page.query_selector_all(".mbsc-listview-item")
    for j, row in enumerate(match_els[:15]):
        row_text = (await row.inner_text()).strip()
        if not contains_club(row_text):
            continue
            
        parts = [p.strip() for p in row_text.split("\n") if p.strip()]
        
        # Intentar extraer el marcador (ej: 2 - 1)
        score = "Pendiente"
        opponent = "Por confirmar"
        
        # Lógica de extracción de marcador y oponente
        # Buscamos patrones de números aislados o con guion
        score_parts = []
        for p in parts:
            if re.match(r'^\d+$', p) and len(p) <= 2:
                score_parts.append(p)
            elif len(p) > 3 and not contains_club(p) and not any(char.isdigit() for char in p[:2]):
                opponent = p

        if len(score_parts) >= 2:
            score = f"{score_parts[0]} - {score_parts[1]}"

        schedule.append({
            "j": j + 1,
            "date": parts[0] if parts else "TBD",
            "time": "TBD",
            "opponent": opponent,
            "score": score,
            "venue": "Por confirmar",
            "isHome": True,
            "status": "completed" if score != "Pendiente" else "upcoming"
        })

    # === Roster (Plantilla) ===
    roster = []
    captain = "Pendiente Oficial"
    
    # Intentar buscar el tab de Jugadors/Plantilla si existe
    try:
        jugadors_tab = page.get_by_text("Jugadors", exact=False)
        if await jugadors_tab.is_visible():
            await jugadors_tab.click()
            await page.wait_for_timeout(2000)
            
            # Extraer jugadores
            player_els = await page.query_selector_all(".mbsc-listview-item")
            for p_el in player_els:
                p_text = (await p_el.inner_text()).strip()
                if not p_text or any(kw in p_text.lower() for kw in ["partits", "clasificació", "jugadors"]):
                    continue
                
                p_parts = [pt.strip() for pt in p_text.split("\n") if pt.strip()]
                if p_parts:
                    p_name = p_parts[0]
                    p_pts = "0"
                    if len(p_parts) > 1:
                        # Buscar puntos (ej: "1.250 pts")
                        pts_match = re.search(r'([\d\.]+)', p_parts[-1])
                        if pts_match:
                            p_pts = pts_match.group(1)
                    
                    roster.append({"name": p_name, "pts": p_pts})
            
            if roster:
                captain = roster[0]["name"] # El primero suele ser el capitán
    except Exception as e:
        print(f"            [AVISO] No se pudo extraer la plantilla: {e}")

    return {
        "id": slug(team_name),
        "name": team_name.upper(),
        "category": cat,
        "division": division,
        "group": group_name,
        "captain": captain,
        "ranking": 0,
        "points": 0,
        "stats": {"pj": 0, "pg": 0, "pp": 0, "sf": 0, "sc": 0},
        "roster": roster,
        "schedule": schedule,
        "nextMatch": next((s for s in schedule if s["status"] == "upcoming"), None),
        "groupStandings": standings,
        "logo": "img/logo_somospadel.png",
        "link": page.url
    }


async def main():
    print("=" * 60)
    print("  BOT v5 DINÁMICO - SOMOS PADEL BCN CAZARRECOMPENSAS")
    print("=" * 60)

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=os.path.join(os.getcwd(), "chrome_data"),
            headless=True,
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()

        tabs = [
            {"name": "Masculí", "cat": "Masculina"},
            {"name": "Femení", "cat": "Femenina"},
            {"name": "Mixte", "cat": "Mixta"}
        ]

        for tab in tabs:
            print(f"\n[TAB] Explorando pestaña: {tab['name']}...", flush=True)
            await page.goto(TARGET_URL, wait_until="networkidle")
            await page.wait_for_timeout(3000)

            # Seleccionar pestaña de género
            try:
                tab_el = page.locator("label.mbsc-segmented-item", has_text=tab["name"]).first
                if await tab_el.is_visible():
                    await tab_el.click()
                    await page.wait_for_timeout(2000)
            except Exception as e:
                print(f"   [AVISO] No se pudo cambiar a pestaña {tab['name']}: {e}")

            # DESCUBRIMIENTO DINÁMICO DE CATEGORÍAS (Solo Pádel)
            category_els = await page.query_selector_all("li.mbsc-lv-item")
            found_categories = []
            for cel in category_els:
                txt = (await cel.inner_text()).strip()
                txt_up = txt.upper()
                if any(kw in txt_up for kw in ["MASCULINA", "FEMENINA", "MIXTA", " MIX"]):
                    if txt not in found_categories and len(txt) < 100:
                        found_categories.append(txt)
            
            # ORDEN DE PRIORIDAD: Tercera y Cuarta primero si estamos en Masculino
            if tab["cat"] == "Masculina":
                found_categories.sort(key=lambda x: 0 if ("TERCERA" in x.upper() or "CUARTA" in x.upper() or "QUARTA" in x.upper()) else 1)

            print(f"   [INFO] {len(found_categories)} categorías detectadas: {found_categories}")

            # Procesar cada categoría descubierta
            for div_text in found_categories:
                print(f"\n   [DIV] Procesando categoría: {div_text}", flush=True)
                
                try:
                    # Clicar en la categoría
                    cat_el = page.locator("li.mbsc-lv-item", has_text=div_text).first
                    await cat_el.click()
                    await page.wait_for_timeout(3000)

                    # Auto-desplegar grupos
                    try:
                        collapsibles = await page.query_selector_all(".mbsc-collapsible-header")
                        for col in collapsibles:
                            await col.click()
                            await page.wait_for_timeout(500)
                    except:
                        pass

                    # Detectar grupos dentro de la categoría
                    group_els = await page.query_selector_all("li.mbsc-lv-item, .mbsc-listview-item")
                    group_names = []
                    for gel in group_els:
                        t = (await gel.inner_text()).strip()
                        if t and len(t) < 40 and any(kw in t.upper() for kw in ["FASE", "GRUPO", " G", "3M", "4M", "5M", "MX", "FM"]):
                            if t not in group_names and t != div_text:
                                group_names.append(t)

                    print(f"      [INFO] {len(group_names)} grupos encontrados")

                    # Entrar en cada grupo
                    for grp_name_raw in group_names:
                        grp_name = grp_name_raw.split("\n")[0].strip()
                        print(f"      [GRP] Intentando entrar en: {grp_name}")
                        
                        try:
                            # MODALIDAD SUPREMA: Buscar el elemento iterando la lista
                            items = await page.query_selector_all("li.mbsc-lv-item, .mbsc-listview-item")
                            target_el = None
                            for item in items:
                                item_text = (await item.inner_text()).strip()
                                if grp_name in item_text:
                                    target_el = item
                                    break
                            
                            if target_el:
                                await target_el.scroll_into_view_if_needed()
                                await page.wait_for_timeout(1000)
                                await target_el.click(timeout=15000)
                                await page.wait_for_timeout(3000)
                            else:
                                raise Exception(f"No se encontró el elemento para {grp_name}")

                            result = await scrape_group(page, tab["cat"], div_text, grp_name)
                            if result:
                                ids = [t["id"] for t in found_teams]
                                if result["id"] not in ids:
                                    found_teams.append(result)
                                    print(f"            [CAZADO] {result['name']}")

                            await page.go_back()
                            await page.wait_for_timeout(1500)
                        except Exception as e:
                            print(f"         [ERR] Error en grupo {grp_name}: {e}")
                            await page.goto(TARGET_URL)
                            # Re-seleccionar tab y categoría para continuar
                            await page.locator("label.mbsc-segmented-item", has_text=tab["name"]).first.click()
                            await page.wait_for_timeout(1000)
                            await page.locator("li.mbsc-lv-item", has_text=div_text).first.click()
                            await page.wait_for_timeout(1000)

                    # Volver a la lista de categorías
                    await page.go_back()
                    await page.wait_for_timeout(1500)

                except Exception as e:
                    print(f"      [ERR] Fallo al procesar categoría {div_text}: {e}")
                    await page.goto(TARGET_URL)
                    await page.wait_for_timeout(1000)

        await context.close()

    print(f"\n[RESULTADO] {len(found_teams)} equipos detectados:")
    for t in found_teams:
        print(f"   -> {t['name']} | {t['group']}")

    js_out = "// Generado automaticamente - Bot SOMOS PADEL BCN v4\n"
    js_out += "window.ExtractedTeamsData = "
    js_out += json.dumps(found_teams, ensure_ascii=False, indent=2)
    js_out += ";\n"

    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_out)

    print(f"[OK] {OUTPUT_JS}")
    print("[DONE] Ve al Admin Panel -> SINCRO SUMMAPADEL")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
