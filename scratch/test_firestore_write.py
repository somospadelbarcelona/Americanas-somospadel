import urllib.request
import json

PROJECT_ID = "americanas-somospadel"
url_create = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/players?documentId=test_temp_bot"

payload = {
    "fields": {
        "name": { "stringValue": "Test Temp Bot" },
        "phone": { "stringValue": "999999999" },
        "role": { "stringValue": "player" }
    }
}

print("Intentando crear un jugador de prueba de forma publica (sin auth)...")
req_create = urllib.request.Request(
    url_create,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req_create) as res:
        print("[OK] Jugador de prueba creado con éxito de forma publica.")
        
        # Now try to delete it
        url_delete = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/players/test_temp_bot"
        print("Intentando borrar el jugador de prueba...")
        req_delete = urllib.request.Request(url_delete, method='DELETE')
        with urllib.request.urlopen(req_delete) as res_del:
            print("[OK] Jugador de prueba borrado con éxito de forma publica.")
except Exception as e:
    print("[FALLO] No se pudo escribir o borrar de forma publica:", e)
