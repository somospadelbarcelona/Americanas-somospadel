import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, context=ctx) as response:
        return json.loads(response.read().decode('utf-8'))

def scan():
    print("Fetching matches...")
    m = fetch("https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/matches?pageSize=1000")
    print("Fetching entrenos_matches...")
    em = fetch("https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/entrenos_matches?pageSize=1000")
    
    docs = m.get('documents', []) + em.get('documents', [])
    found = False
    
    for doc in docs:
        js = json.dumps(doc)
        if "Alejandro" in js or "Coscol" in js or "649219350" in js:
            print(f"FOUND IN DOC: {doc['name']}")
            print(js)
            found = True
            
    if not found:
        print("No matches contain Alejandro Coscolin!")
        
scan()
