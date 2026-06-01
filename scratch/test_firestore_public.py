import urllib.request
import json

PROJECT_ID = "americanas-somospadel"
url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/players?pageSize=5"

print("Intentando leer de Firestore de forma publica (sin cabecera Authorization)...")
try:
    with urllib.request.urlopen(url) as res:
        data = json.loads(res.read().decode('utf-8'))
        docs = data.get('documents', [])
        print(f"[OK] Firestore respondio correctamente. Encontrados {len(docs)} jugadores en la primera pagina.")
        for d in docs:
            name = d.get('fields', {}).get('name', {}).get('stringValue', 'Desconocido')
            print(f"- {name}")
except Exception as e:
    print("[FALLO] No se pudo leer de forma publica:", e)
