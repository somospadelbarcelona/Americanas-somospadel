#!/usr/bin/env python3
"""
prepare_season_2027_from_excel.py
---------------------------------
Lee un Excel (.xlsx) o CSV (.csv) con los equipos y jugadores de la Temporada 2027,
lo compara contra el archivo histórico permanente `js/modules/teams/teams_data_2026.js`,
genera un informe completo (renovados, cambios de equipo, nuevos fichajes y bajas)
y produce `tools/season_2027_import_payload.json` listo para aplicar masivamente
desde Admin -> Temporadas & Plantillas -> "Importar Paquete Excel 2027".

Uso:
    python tools/prepare_season_2027_from_excel.py ruta/al/archivo_2027.xlsx
"""

import json
import os
import re
import sys
import unicodedata
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("❌ Falta pandas. Instala con: pip install pandas openpyxl")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE_2026_JS = ROOT / "js" / "modules" / "teams" / "teams_data_2026.js"
OUTPUT_JSON = ROOT / "tools" / "season_2027_import_payload.json"


def norm_text(val: str) -> str:
    s = str(val or "").strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", s).strip()


def norm_phone(val) -> str:
    digits = re.sub(r"\D+", "", str(val or ""))
    if len(digits) > 9 and digits.startswith("34"):
        digits = digits[2:]
    return digits


def slugify(val: str) -> str:
    s = norm_text(val)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "equipo"


def infer_category(team_name: str, explicit_cat: str = "") -> str:
    raw = norm_text(explicit_cat or team_name)
    if "fem" in raw or re.search(r"\b\d+f[a-z]?\b", raw):
        return "Femenina"
    if "mix" in raw or re.search(r"\b\d+x[a-z]?\b", raw):
        return "Mixta"
    return "Masculina"


def infer_division(team_name: str, explicit_div: str = "") -> str:
    if explicit_div and str(explicit_div).strip():
        return str(explicit_div).strip()
    raw = norm_text(team_name)
    if "1" in raw or "primera" in raw:
        return "Primera"
    if "2" in raw or "segunda" in raw:
        return "Segunda"
    if "4" in raw or "cuarta" in raw:
        return "Cuarta"
    return "Tercera"


def load_2026_archive():
    if not ARCHIVE_2026_JS.exists():
        return []
    text = ARCHIVE_2026_JS.read_text(encoding="utf-8")
    m = re.search(r"const\s+data2026\s*=\s*(\[[\s\S]*?\])\s*;", text)
    if not m:
        return []
    return json.loads(m.group(1))


def find_col(columns, candidates):
    norm_map = {norm_text(c): c for c in columns}
    for cand in candidates:
        for nk, orig in norm_map.items():
            if cand == nk or cand in nk:
                return orig
    return None


def main():
    if len(sys.argv) < 2:
        print("Uso: python tools/prepare_season_2027_from_excel.py <ruta_excel_o_csv>")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    if not input_path.exists():
        print(f"❌ No existe el archivo: {input_path}")
        sys.exit(1)

    if input_path.suffix.lower() == ".csv":
        df = pd.read_csv(input_path)
    else:
        df = pd.read_excel(input_path)

    df = df.dropna(how="all")
    cols = list(df.columns)

    col_name = find_col(cols, ["nombre", "jugador", "name", "player", "apellidos"])
    col_team = find_col(cols, ["equipo", "team", "equipo 2027", "categoria equipo"])
    col_phone = find_col(cols, ["telefono", "movil", "phone", "whatsapp", "tel"])
    col_email = find_col(cols, ["email", "correo", "mail"])
    col_level = find_col(cols, ["nivel", "level", "playtomic"])
    col_gender = find_col(cols, ["genero", "sexo", "gender"])
    col_role = find_col(cols, ["rol", "role", "capitan", "cargo"])
    col_cat = find_col(cols, ["categoria", "category"])
    col_div = find_col(cols, ["division", "grupo"])

    if not col_name or not col_team:
        print(f"❌ No se detectaron columnas mínimas (Nombre y Equipo). Columnas encontradas: {cols}")
        sys.exit(1)

    teams_map = {}
    players_dir = {}

    for _, row in df.iterrows():
        raw_name = str(row.get(col_name, "") or "").strip()
        raw_team = str(row.get(col_team, "") or "").strip()
        if not raw_name or raw_name.lower() == "nan" or not raw_team or raw_team.lower() == "nan":
            continue

        team_display = raw_team.upper()
        if not team_display.startswith("SOMOS"):
            team_display = f"SOMOS PÁDEL BCN {team_display}"
        team_id = slugify(team_display)

        cat = infer_category(team_display, str(row.get(col_cat, "") or "") if col_cat else "")
        div = infer_division(team_display, str(row.get(col_div, "") or "") if col_div else "")

        phone = norm_phone(row.get(col_phone, "")) if col_phone else ""
        email = str(row.get(col_email, "") or "").strip() if col_email else ""
        if email.lower() == "nan":
            email = ""

        level_val = None
        if col_level and pd.notna(row.get(col_level)):
            try:
                level_val = float(str(row.get(col_level)).replace(",", "."))
            except ValueError:
                level_val = None

        gender = str(row.get(col_gender, "") or "").strip() if col_gender else ""
        if gender.lower() == "nan":
            gender = ""

        role_raw = norm_text(row.get(col_role, "")) if col_role else ""
        is_captain = "capitan" in role_raw and "sub" not in role_raw
        is_subcaptain = "subcapitan" in role_raw or "sub-capitan" in role_raw

        if team_id not in teams_map:
            teams_map[team_id] = {
                "id": team_id,
                "name": team_display,
                "category": cat,
                "division": div,
                "group": "Temporada 2027",
                "captain": "Por definir",
                "subcaptain": "Por definir",
                "logo": "img/logo_somospadel.png",
                "ranking": 0,
                "points": 0,
                "stats": {"pj": 0, "pg": 0, "pp": 0, "sf": 0, "sc": 0, "df": 0},
                "standings": [],
                "schedule": [],
                "seasonId": "2027",
                "roster": []
            }

        if is_captain:
            teams_map[team_id]["captain"] = raw_name
        elif is_subcaptain:
            teams_map[team_id]["subcaptain"] = raw_name

        nkey = norm_text(raw_name)
        if not any(norm_text(p["name"]) == nkey for p in teams_map[team_id]["roster"]):
            teams_map[team_id]["roster"].append({
                "name": raw_name,
                "pts": 0,
                "seasonStatus": "participante"
            })

        if nkey not in players_dir:
            players_dir[nkey] = {
                "name": raw_name,
                "phone": phone,
                "email": email,
                "level": level_val,
                "gender": gender,
                "isCaptain": is_captain,
                "teams": [team_id],
                "teamNames": [team_display]
            }
        else:
            if team_id not in players_dir[nkey]["teams"]:
                players_dir[nkey]["teams"].append(team_id)
                players_dir[nkey]["teamNames"].append(team_display)
            if is_captain:
                players_dir[nkey]["isCaptain"] = True
            if phone and not players_dir[nkey]["phone"]:
                players_dir[nkey]["phone"] = phone

    # Cruzar contra Temporada 2026 para clasificar renovados / cambios / nuevos / bajas
    teams_2026 = load_2026_archive()
    prev_players = {}
    for t in teams_2026:
        for p in t.get("roster", []):
            pname = p.get("name", "") if isinstance(p, dict) else str(p)
            nk = norm_text(pname)
            if not nk:
                continue
            prev_players.setdefault(nk, {"name": pname, "teams": []})
            if t["id"] not in prev_players[nk]["teams"]:
                prev_players[nk]["teams"].append(t["id"])

    stayed, switched, joined, left = [], [], [], []
    for nk, p in players_dir.items():
        if nk not in prev_players:
            joined.append(p["name"])
        else:
            if any(tid in prev_players[nk]["teams"] for tid in p["teams"]):
                stayed.append(p["name"])
            else:
                switched.append(p["name"])

    for nk, prev in prev_players.items():
        if nk not in players_dir:
            left.append({"name": prev["name"], "previousTeams": prev["teams"]})

    payload = {
        "seasonId": "2027",
        "label": "Temporada 2027",
        "leagueName": "Lliga GuinotPrunera",
        "previousSeasonId": "2026",
        "teams": list(teams_map.values()),
        "playersDirectory": list(players_dir.values()),
        "summary": {
            "teamsCount": len(teams_map),
            "playersCount": len(players_dir),
            "stayedCount": len(stayed),
            "switchedCount": len(switched),
            "joinedCount": len(joined),
            "leftCount": len(left)
        },
        "departuresFrom2026": left
    }

    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print("✅ PAQUETE TEMPORADA 2027 GENERADO:", OUTPUT_JSON)
    print(f"   • Equipos 2027: {len(teams_map)}")
    print(f"   • Jugadores 2027: {len(players_dir)}")
    print(f"   • Renovados: {len(stayed)} | Cambios equipo: {len(switched)} | Nuevos: {len(joined)} | Bajas (se retirará permiso): {len(left)}")


if __name__ == "__main__":
    main()
