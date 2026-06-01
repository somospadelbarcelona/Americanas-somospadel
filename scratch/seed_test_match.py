import urllib.request
import json
import datetime

PROJECT_ID = "americanas-somospadel"

# Get dynamic dates
today_str = datetime.date.today().strftime("%Y-%m-%d")
tomorrow_str = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
after_tomorrow_str = (datetime.date.today() + datetime.timedelta(days=2)).strftime("%Y-%m-%d")

# 1. Match for TODAY (Can Via Racket Club)
document_id_1 = "playtomic_406d79a9-e59c-4768-bcdb-639eaf1baead"
url_1 = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/open_matches/{document_id_1}?updateMask.fieldPaths=club&updateMask.fieldPaths=date&updateMask.fieldPaths=time&updateMask.fieldPaths=duration&updateMask.fieldPaths=level_min&updateMask.fieldPaths=level_max&updateMask.fieldPaths=players&updateMask.fieldPaths=spots_needed&updateMask.fieldPaths=playtomic_url&updateMask.fieldPaths=original_text&updateMask.fieldPaths=status"

payload_1 = {
    "fields": {
        "club": { "stringValue": "Can Via Racket Club" },
        "date": { "stringValue": today_str },
        "time": { "stringValue": "20:00" },
        "duration": { "integerValue": "90" },
        "level_min": { "doubleValue": 2.79 },
        "level_max": { "doubleValue": 3.79 },
        "players": {
            "arrayValue": {
                "values": [
                    { "stringValue": "Jordi Diaz Llopis" },
                    { "stringValue": "Carlos Jimenez Lora" }
                ]
            }
        },
        "spots_needed": { "integerValue": "2" },
        "playtomic_url": { "stringValue": "https://app.playtomic.io/matches/406d79a9-e59c-4768-bcdb-639eaf1baead?utm_source=manager" },
        "original_text": { "stringValue": "PARTIDO EN CAN VÍA RACKET CLUB 💪\n📅 Hoy, 20:00 90 min\n📍 Can Vía Racket Club\n📊 2.79 - 3.79\n✔️ Jordi Díaz Llopis (3.04)\n✔️ Carlos Jiménez Lora (3.25)\n✔️ ??\n✔️ ??\nhttps://app.playtomic.io/matches/406d79a9-e59c-4768-bcdb-639eaf1baead" },
        "status": { "stringValue": "active" }
    }
}

# 2. Match for TOMORROW (Padel Indoor Hospitalet)
document_id_2 = "playtomic_882cc9b1-f92e-4b2a-a553-628dcf328fa3"
url_2 = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/open_matches/{document_id_2}?updateMask.fieldPaths=club&updateMask.fieldPaths=date&updateMask.fieldPaths=time&updateMask.fieldPaths=duration&updateMask.fieldPaths=level_min&updateMask.fieldPaths=level_max&updateMask.fieldPaths=players&updateMask.fieldPaths=spots_needed&updateMask.fieldPaths=playtomic_url&updateMask.fieldPaths=original_text&updateMask.fieldPaths=status"

payload_2 = {
    "fields": {
        "club": { "stringValue": "Padel Indoor Hospitalet" },
        "date": { "stringValue": tomorrow_str },
        "time": { "stringValue": "18:30" },
        "duration": { "integerValue": "90" },
        "level_min": { "doubleValue": 3.00 },
        "level_max": { "doubleValue": 4.00 },
        "players": {
            "arrayValue": {
                "values": [
                    { "stringValue": "Marc Rius Camps" },
                    { "stringValue": "Albert Vila Gomez" },
                    { "stringValue": "Sergio Gomez Pons" }
                ]
            }
        },
        "spots_needed": { "integerValue": "1" },
        "playtomic_url": { "stringValue": "https://app.playtomic.io/matches/882cc9b1-f92e-4b2a-a553-628dcf328fa3?utm_source=manager" },
        "original_text": { "stringValue": "PARTIDO EN PADEL INDOOR HOSPITALET 🎾\n📅 Mañana, 18:30 90 min\n📍 Padel Indoor Hospitalet\n📊 3.00 - 4.00\n✔️ Marc Rius Camps\n✔️ Albert Vila Gomez\n✔️ Sergio Gomez Pons\n✔️ ??\nhttps://app.playtomic.io/matches/882cc9b1-f92e-4b2a-a553-628dcf328fa3" },
        "status": { "stringValue": "active" }
    }
}

# 3. Match for AFTER TOMORROW (User Registered: Alex Coscolin)
document_id_3 = "playtomic_c488ad53-294b-449e-b2d9-e932cfef2981"
url_3 = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/open_matches/{document_id_3}?updateMask.fieldPaths=club&updateMask.fieldPaths=date&updateMask.fieldPaths=time&updateMask.fieldPaths=duration&updateMask.fieldPaths=level_min&updateMask.fieldPaths=level_max&updateMask.fieldPaths=players&updateMask.fieldPaths=spots_needed&updateMask.fieldPaths=playtomic_url&updateMask.fieldPaths=original_text&updateMask.fieldPaths=status"

payload_3 = {
    "fields": {
        "club": { "stringValue": "Somos Padel Barcelona Nick" },
        "date": { "stringValue": after_tomorrow_str },
        "time": { "stringValue": "19:30" },
        "duration": { "integerValue": "90" },
        "level_min": { "doubleValue": 3.20 },
        "level_max": { "doubleValue": 4.20 },
        "players": {
            "arrayValue": {
                "values": [
                    { "stringValue": "Alex Coscolin" },
                    { "stringValue": "Jordi Diaz Llopis" },
                    { "stringValue": "Carlos Jimenez Lora" }
                ]
            }
        },
        "spots_needed": { "integerValue": "1" },
        "playtomic_url": { "stringValue": "https://app.playtomic.io/matches/c488ad53-294b-449e-b2d9-e932cfef2981?utm_source=manager" },
        "original_text": { "stringValue": "PARTIDO EN NICK CLUB PADEL 💪\n📅 Pasado Mañana, 19:30 90 min\n📍 Nick Club Padel Barcelona\n📊 3.20 - 4.20\n✔️ Alex Coscolin\n✔️ Jordi Díaz Llopis\n✔️ Carlos Jiménez Lora\n✔️ ??\nhttps://app.playtomic.io/matches/c488ad53-294b-449e-b2d9-e932cfef2981" },
        "status": { "stringValue": "active" }
    }
}

def seed_match(url, payload, name):
    print(f"Inyectando partida de prueba ({name}) en Firestore...")
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req) as res:
            print(f"[OK] Partida ({name}) inyectada con éxito.")
    except Exception as e:
        print(f"[ERROR] Fallo al inyectar partida ({name}):", e)

seed_match(url_1, payload_1, "HOY - Can Via")
seed_match(url_2, payload_2, "MAÑANA - Hospitalet")
seed_match(url_3, payload_3, "PASADO MAÑANA - Nick (Alex)")
