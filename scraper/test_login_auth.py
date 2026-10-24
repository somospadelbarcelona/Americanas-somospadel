import urllib.request
import urllib.error
import json
import re

def test_web_scripts():
    req = urllib.request.Request('https://app.playtomic.com/', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            scripts = re.findall(r'src="([^"]+\.js)"', html)
            print("Found scripts:", scripts[:10])
            for s in scripts:
                if 'main' in s or 'app' in s or 'auth' in s or 'chunk' in s or 'bundle' in s:
                    full_url = s if s.startswith('http') else ('https://app.playtomic.com' + (s if s.startswith('/') else '/' + s))
                    print("Inspecting script:", full_url)
                    try:
                        s_req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(s_req) as s_resp:
                            js_text = s_resp.read().decode('utf-8', errors='ignore')
                            matches = re.findall(r'auth/login[^\"]*', js_text)
                            if matches:
                                print("Found auth/login in", full_url, matches[:5])
                            client_ids = re.findall(r'client_id[^,;}\n]+', js_text)
                            if client_ids:
                                print("Found client_id:", client_ids[:5])
                    except Exception as err:
                        print("Error reading script:", err)
    except Exception as e:
        print("Web script error:", e)

if __name__ == '__main__':
    test_web_scripts()
