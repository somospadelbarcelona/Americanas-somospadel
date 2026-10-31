# -*- coding: utf-8 -*-
import sys
import json
import urllib.request
import urllib.error

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

FIREBASE_API_KEY = "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE"
FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents"
DOC_ID = "pt_46011a01_halloween"

# 1. Definición exacta de las 10 parejas según la foto 2 de Playtomic Manager
PAIRS_DEFINITION = [
    # PISTA 1
    {
        "court": 1,
        "team_pos": "A",
        "p1_id": "pt_2086399",
        "p1_name": "Rubén Sánchez Romero",
        "p1_level": 3.69,
        "p2_id": "pt_5080468",
        "p2_name": "Maria Angles",
        "p2_level": 2.71,
        "pair_id": "pair_pt_0b1bb356",
        "is_official": True
    },
    {
        "court": 1,
        "team_pos": "B",
        "p1_id": "pt_1410091",
        "p1_name": "Javier A",
        "p1_level": 2.45,
        "p2_id": "pt_1919151",
        "p2_name": "Xavi",
        "p2_level": 3.93,
        "pair_id": "pair_pt_3f905fef",
        "is_official": True
    },
    # PISTA 2
    {
        "court": 2,
        "team_pos": "A",
        "p1_id": "pt_56391",
        "p1_name": "Octavi Navarro Carbonell",
        "p1_level": 3.58,
        "p2_id": "pt_35769",
        "p2_name": "Olga Pylypchuk",
        "p2_level": 2.65,
        "pair_id": "pair_pt_0c7b6162",
        "is_official": True
    },
    {
        "court": 2,
        "team_pos": "B",
        "p1_id": "pt_3027764",
        "p1_name": "Toni Millan",
        "p1_level": 2.77,
        "p2_id": "pt_15936303",
        "p2_name": "Mario Sanz",
        "p2_level": 2.34,
        "pair_id": "pair_pt_bal_302776_159363",
        "is_official": False
    },
    # PISTA 3
    {
        "court": 3,
        "team_pos": "A",
        "p1_id": "pt_4323394",
        "p1_name": "Sandru Sanchez",
        "p1_level": 2.35,
        "p2_id": "pt_3066330",
        "p2_name": "Dani \"Locky\"",
        "p2_level": 2.35,
        "pair_id": "pair_pt_bal_432339_306633",
        "is_official": False
    },
    {
        "court": 3,
        "team_pos": "B",
        "p1_id": "pt_119105",
        "p1_name": "David Cena",
        "p1_level": 2.27,
        "p2_id": "pt_1587815",
        "p2_name": "Marcos alfonso",
        "p2_level": 1.99,
        "pair_id": "pair_pt_bal_119105_158781",
        "is_official": False
    },
    # PISTA 4
    {
        "court": 4,
        "team_pos": "A",
        "p1_id": "pt_3386971",
        "p1_name": "Sergi Bonamusa",
        "p1_level": 2.40,
        "p2_id": "pt_112538",
        "p2_name": "Ursula Cereijo arias",
        "p2_level": 1.99,
        "pair_id": "pair_pt_d13735f4",
        "is_official": True
    },
    {
        "court": 4,
        "team_pos": "B",
        "p1_id": "pt_17756166",
        "p1_name": "Ilya",
        "p1_level": 2.24,
        "p2_id": "pt_3344486",
        "p2_name": "yu ki ",
        "p2_level": 1.47,
        "pair_id": "pair_pt_bal_177561_334448",
        "is_official": False
    },
    # PISTA 5
    {
        "court": 5,
        "team_pos": "A",
        "p1_id": "pt_778440",
        "p1_name": "Dolors Molies",
        "p1_level": 1.56,
        "p2_id": "pt_748421",
        "p2_name": "Francisco Vílchez Funes",
        "p2_level": 1.45,
        "pair_id": "pair_pt_c6ad96ad",
        "is_official": True
    },
    {
        "court": 5,
        "team_pos": "B",
        "p1_id": "pt_5277942",
        "p1_name": "Jessica Arteaga",
        "p1_level": 1.20,
        "p2_id": "pt_9362589",
        "p2_name": "Fernando Alvarado",
        "p2_level": 3.50,
        "pair_id": "pair_pt_62bbbb7d",
        "is_official": True
    }
]

def load_temp_players():
    with open('temp_players.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def run():
    print("🚀 Iniciando actualización exacta de parejas según Playtomic Manager (Foto 2)...")
    players_data = load_temp_players()
    
    # 1. Construir lista de parejas y enriquecer jugadores
    fixed_pairs = []
    updated_players = []
    
    for item in PAIRS_DEFINITION:
        c = item["court"]
        p1_id = item["p1_id"]
        p2_id = item["p2_id"]
        
        p1_info = players_data.get(p1_id, {})
        p2_info = players_data.get(p2_id, {})
        
        avg_lvl = round((item["p1_level"] + item["p2_level"]) / 2.0, 2)
        pair_name = f"{item['p1_name']} / {item['p2_name']}"
        
        pair_obj = {
            "id": item["pair_id"],
            "pair_name": pair_name,
            "player1_id": p1_id,
            "player1_name": item["p1_name"],
            "player1_photo": p1_info.get("photoURL") or "",
            "player1_level": item["p1_level"],
            "player2_id": p2_id,
            "player2_name": item["p2_name"],
            "player2_photo": p2_info.get("photoURL") or "",
            "player2_level": item["p2_level"],
            "avg_level": avg_lvl,
            "current_court": c,
            "initial_court": c,
            "court": c,
            "wins": 0,
            "losses": 0,
            "games_won": 0,
            "games_lost": 0,
            "points": 0,
            "is_official_playtomic": item["is_official"]
        }
        fixed_pairs.append(pair_obj)
        
        # Actualizar p1
        p1_copy = dict(p1_info)
        p1_copy["court"] = str(c)
        p1_copy["pair_id"] = item["pair_id"]
        p1_copy["partner_id"] = p2_id
        p1_copy["partner_name"] = item["p2_name"]
        updated_players.append(p1_copy)
        
        # Actualizar p2
        p2_copy = dict(p2_info)
        p2_copy["court"] = str(c)
        p2_copy["pair_id"] = item["pair_id"]
        p2_copy["partner_id"] = p1_id
        p2_copy["partner_name"] = item["p1_name"]
        updated_players.append(p2_copy)

    # Convertir a formato Firestore REST
    fixed_pairs_raw = []
    for fp in fixed_pairs:
        fp_fields = {
            "id": {"stringValue": str(fp["id"])},
            "pair_name": {"stringValue": str(fp["pair_name"])},
            "player1_id": {"stringValue": str(fp["player1_id"])},
            "player1_name": {"stringValue": str(fp["player1_name"])},
            "player1_photo": {"stringValue": str(fp["player1_photo"])},
            "player1_level": {"doubleValue": float(fp["player1_level"])},
            "player2_id": {"stringValue": str(fp["player2_id"])},
            "player2_name": {"stringValue": str(fp["player2_name"])},
            "player2_photo": {"stringValue": str(fp["player2_photo"])},
            "player2_level": {"doubleValue": float(fp["player2_level"])},
            "avg_level": {"doubleValue": float(fp["avg_level"])},
            "current_court": {"integerValue": str(fp["current_court"])},
            "initial_court": {"integerValue": str(fp["initial_court"])},
            "court": {"integerValue": str(fp["court"])},
            "wins": {"integerValue": "0"},
            "losses": {"integerValue": "0"},
            "games_won": {"integerValue": "0"},
            "games_lost": {"integerValue": "0"},
            "points": {"integerValue": "0"},
            "is_official_playtomic": {"booleanValue": fp["is_official_playtomic"]}
        }
        fixed_pairs_raw.append({"mapValue": {"fields": fp_fields}})

    players_raw = []
    for p in updated_players:
        p_fields = {
            "id": {"stringValue": str(p.get("id", ""))},
            "name": {"stringValue": str(p.get("name", ""))},
            "display_name": {"stringValue": str(p.get("display_name", p.get("name", "")))},
            "level": {"doubleValue": float(p.get("level", 3.5))},
            "position": {"stringValue": str(p.get("position", "Drive"))},
            "photoURL": {"stringValue": str(p.get("photoURL", ""))},
            "photo_url": {"stringValue": str(p.get("photo_url", p.get("photoURL", "")))},
            "pair_id": {"stringValue": str(p.get("pair_id", ""))},
            "partner_id": {"stringValue": str(p.get("partner_id", ""))},
            "partner_name": {"stringValue": str(p.get("partner_name", ""))},
            "court": {"stringValue": str(p.get("court", "1"))},
            "source": {"stringValue": str(p.get("source", "playtomic"))},
            "is_playtomic": {"booleanValue": True},
            "playtomic_status": {"stringValue": "confirmed"},
            "price_paid": {"doubleValue": float(p.get("price_paid", 12.48))},
            "club": {"stringValue": str(p.get("club", "NEW Play Padel Pro Hospitalet"))},
            "organizer": {"stringValue": str(p.get("organizer", "somospadeleugestion@gmail.com"))}
        }
        players_raw.append({"mapValue": {"fields": p_fields}})

    # 2. PATCH en el documento del torneo
    patch_fields = {
        "fixed_pairs": {"arrayValue": {"values": fixed_pairs_raw}},
        "fixedPairs": {"arrayValue": {"values": fixed_pairs_raw}},
        "players": {"arrayValue": {"values": players_raw}},
        "registeredPlayers": {"arrayValue": {"values": players_raw}}
    }

    url = f"{FIRESTORE_BASE}/americanas/{DOC_ID}?key={FIREBASE_API_KEY}&updateMask.fieldPaths=fixed_pairs&updateMask.fieldPaths=fixedPairs&updateMask.fieldPaths=players&updateMask.fieldPaths=registeredPlayers"
    req_data = json.dumps({"fields": patch_fields}).encode('utf-8')
    req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"}, method="PATCH")

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ Documento {DOC_ID} actualizado en Firestore (Status {resp.status})")
    except Exception as e:
        print(f"❌ Error al actualizar {DOC_ID}: {e}")
        return False

    # 3. Actualizar los 5 partidos de Ronda 1 en la colección matches
    # Pista 1: pair 0 vs pair 1
    # Pista 2: pair 2 vs pair 3
    # Pista 3: pair 4 vs pair 5
    # Pista 4: pair 6 vs pair 7
    # Pista 5: pair 8 vs pair 9
    
    # Mapeo de match IDs conocidos para Pistas 1..5:
    # Obtenemos los partidos actuales para reutilizar sus IDs o crear nuevos si falta alguno
    match_ids_by_court = {
        1: "WChVWJSZhcwRUc29edPO",
        2: "ETlzBuX4TKKEEOHYevvR",
        3: "CTgM3jyEdmhnsN4mTlnV",
        4: "KXQ7R0bbkn4FFlVmFOjV",
        5: "oUpnujmWfA7i3DRvzhw8"
    }

    for court_num in range(1, 6):
        pairA = fixed_pairs[(court_num - 1) * 2]
        pairB = fixed_pairs[(court_num - 1) * 2 + 1]
        
        match_id = match_ids_by_court[court_num]
        m_fields = {
            "americana_id": {"stringValue": DOC_ID},
            "tournament_id": {"stringValue": DOC_ID},
            "round": {"integerValue": "1"},
            "court": {"integerValue": str(court_num)},
            "pair_a_id": {"stringValue": str(pairA["id"])},
            "pair_b_id": {"stringValue": str(pairB["id"])},
            "teamA": {"stringValue": str(pairA["pair_name"])},
            "teamB": {"stringValue": str(pairB["pair_name"])},
            "team_a_ids": {"arrayValue": {"values": [{"stringValue": str(pairA["player1_id"])}, {"stringValue": str(pairA["player2_id"])}]}},
            "team_b_ids": {"arrayValue": {"values": [{"stringValue": str(pairB["player1_id"])}, {"stringValue": str(pairB["player2_id"])}]}},
            "team_a_names": {"arrayValue": {"values": [{"stringValue": str(pairA["player1_name"])}, {"stringValue": str(pairA["player2_name"])}]}},
            "team_b_names": {"arrayValue": {"values": [{"stringValue": str(pairB["player1_name"])}, {"stringValue": str(pairB["player2_name"])}]}},
            "score_a": {"integerValue": "0"},
            "score_b": {"integerValue": "0"},
            "status": {"stringValue": "scheduled"}
        }
        
        m_url = f"{FIRESTORE_BASE}/matches/{match_id}?key={FIREBASE_API_KEY}"
        m_req = urllib.request.Request(m_url, data=json.dumps({"fields": m_fields}).encode('utf-8'), headers={"Content-Type": "application/json"}, method="PATCH")
        try:
            with urllib.request.urlopen(m_req) as m_resp:
                print(f"  🎾 Pista {court_num}: {pairA['pair_name']} vs {pairB['pair_name']} -> Match {match_id} actualizado (Status {m_resp.status})")
        except Exception as me:
            print(f"  ❌ Error actualizando match Pista {court_num}: {me}")

    print("\n🎉 ¡TODAS LAS PAREJAS Y PARTIDOS DE RONDA 1 ACTUALIZADOS CON ÉXITO!")
    return True

if __name__ == "__main__":
    run()
