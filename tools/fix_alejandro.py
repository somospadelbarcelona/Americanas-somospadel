import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

NEW_UID = "udlE3GafGB4NW6qbNkB7"
OLD_ID = "u_649219350"
PROJECT_ID = "americanas-somospadel"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def fetch(url):
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {"documents": []}

def patch(url, payload, mask):
    mask_qs = "&".join([f"updateMask.fieldPaths={m}" for m in mask])
    full_url = f"{url}?{mask_qs}"
    req = urllib.request.Request(full_url, data=json.dumps({"fields": payload}).encode('utf-8'), method='PATCH')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error patching: {e}")
        return None

def process_array(val):
    if not val or 'arrayValue' not in val or 'values' not in val['arrayValue']: return False, val
    vals = val['arrayValue']['values']
    changed = False
    new_vals = []
    for v in vals:
        if 'stringValue' in v and v['stringValue'] == OLD_ID:
            new_vals.append({'stringValue': NEW_UID})
            changed = True
        else:
            new_vals.append(v)
    
    return changed, {'arrayValue': {'values': new_vals}}

def process_collection(col_name):
    print(f"Scanning {col_name}...")
    data = fetch(f"{BASE_URL}/{col_name}?pageSize=1000")
    docs = data.get('documents', [])
    updated = 0
    
    for doc in docs:
        id = doc['name'].split('/')[-1]
        fields = doc.get('fields', {})
        
        needs_update = False
        payload = {}
        mask = []
        
        # team_a_ids
        if 'team_a_ids' in fields:
            changed, new_val = process_array(fields['team_a_ids'])
            if changed:
                payload['team_a_ids'] = new_val
                mask.append('team_a_ids')
                needs_update = True
                
        # team_b_ids
        if 'team_b_ids' in fields:
            changed, new_val = process_array(fields['team_b_ids'])
            if changed:
                payload['team_b_ids'] = new_val
                mask.append('team_b_ids')
                needs_update = True
                
        # players
        if 'players' in fields:
            changed, new_val = process_array(fields['players'])
            if changed:
                payload['players'] = new_val
                mask.append('players')
                needs_update = True
                
        # individual players
        for p in ['player1', 'player2', 'player3', 'player4']:
            if p in fields and 'stringValue' in fields[p] and fields[p]['stringValue'] == OLD_ID:
                payload[p] = {'stringValue': NEW_UID}
                mask.append(p)
                needs_update = True
                
        if needs_update:
            print(f"Updating match {id} in {col_name}...")
            patch(f"{BASE_URL}/{col_name}/{id}", payload, mask)
            updated += 1
            
    print(f"Collection {col_name}: {updated} matches updated.")
    return updated

print("Starting migration script for Alejandro Coscolín...")
am = process_collection('matches')
en = process_collection('entrenos_matches')
print(f"DONE! Total matches rescued: {am + en}")
