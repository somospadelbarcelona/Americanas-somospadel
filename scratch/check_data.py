import json
import os

filepath = os.path.join("scraper", "teams_data_auto.js")
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extraer el JSON
    start = content.find("window.ExtractedTeamsData = ") + len("window.ExtractedTeamsData = ")
    end = content.rfind(";")
    json_data = json.loads(content[start:end])
    
    # Buscar el equipo somos-padel-bcn-4m
    for team in json_data:
        if team["id"] == "somos-padel-bcn-4m":
            print("Nombre:", team["name"])
            print("Puntos:", team["points"])
            print("Stats:", team["stats"])
            print("Clasificación (Tabla):")
            for st in team["groupStandings"]:
                print(f"  {st['pos']}. {st['team']}: PJ={st['pj']}, PG={st['pg']}, PP={st['pp']}, PTS={st['pts']}")
            print("Calendario (Schedule):")
            for m in team["schedule"]:
                print(f"  J{m['j']}: {m['opponent']} | Score: {m['score']} | Status: {m['status']} | isHome: {m['isHome']}")
else:
    print("No existe el archivo teams_data_auto.js")
