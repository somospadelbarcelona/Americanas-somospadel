import json
import re

def main():
    try:
        data = open('scraper/teams_data_auto.js', encoding='utf-8').read()
        json_str = re.search(r'window\.ExtractedTeamsData\s*=\s*(\[[\s\S]*?\])\s*;', data).group(1)
        teams = json.loads(json_str)
        t = next(x for x in teams if x['id'] == 'somos-padel-bcn-4m')
        
        print(f"=== PARTIDOS DE SOMOS PÁDEL BCN 4M ===")
        for m in t["schedule"]:
            print(f"J{m['j']}: vs {m['opponent']} | score: {m['score']} | status: {m['status']} | venue: {m['venue']}")
            
        print("\n=== CLASIFICACIÓN DE SU GRUPO ===")
        for s in t["groupStandings"]:
            print(f"#{s['pos']} {s['team']} | PJ={s['pj']}, PTS={s['pts']}, PG={s['pg']}, PP={s['pp']}")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
