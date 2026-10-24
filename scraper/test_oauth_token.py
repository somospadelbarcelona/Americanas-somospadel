import urllib.request
import urllib.parse
import urllib.error
import json

url = "https://api.app.playtomic.io/v3/auth/token"

# Test form urlencoded
form_data = {
    "grant_type": "password",
    "username": "somospadeleugestion@gmail.com",
    "password": "Factor2000!",
}
encoded_data = urllib.parse.urlencode(form_data).encode("utf-8")

req = urllib.request.Request(
    url,
    data=encoded_data,
    headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Playtomic/1.0"
    }
)
try:
    with urllib.request.urlopen(req) as resp:
        print("Success urlencoded:", resp.status, resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTPError urlencoded:", e.code, e.read().decode("utf-8"))

# Test JSON
for scope in [None, "playtomic", "default", "customer", "all"]:
    payload = {
        "grant_type": "password",
        "username": "somospadeleugestion@gmail.com",
        "password": "Factor2000!"
    }
    if scope:
        payload["scope"] = scope
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Playtomic/1.0"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print("Success JSON scope", scope, ":", resp.status, resp.read().decode("utf-8"))
            break
    except urllib.error.HTTPError as e:
        print(f"HTTPError JSON scope {scope}:", e.code, e.read().decode("utf-8"))
