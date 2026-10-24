# -*- coding: utf-8 -*-
import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

api_key = "AIzaSyCngqRMcffLA8NZWS6eMN4KikucDC-_V-Y"
email = "somospadeleugestion@gmail.com"

# Check auth methods on Firebase Auth of Playtomic Manager
url = f"https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key={api_key}"
payload = json.dumps({
    "identifier": email,
    "continueUri": "https://manager.playtomic.io"
}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=5, context=ctx) as r:
        print("Status:", r.status)
        data = json.loads(r.read().decode('utf-8'))
        print("Playtomic Manager Auth response:")
        print(json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("Err:", e)
