import os
import re

search_term = "RUBI"
files_to_check = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '.antigravity' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.json', '.txt', '.js')):
            files_to_check.append(os.path.join(root, file))

print(f"Checking {len(files_to_check)} files for '{search_term}'...")
for file_path in files_to_check:
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        matches = [m.start() for m in re.finditer(search_term, content, re.IGNORECASE)]
        if matches:
            print(f"\nFile: {file_path} - found {len(matches)} matches")
            for m in matches[:5]:
                context = content[max(0, m-80):min(len(content), m+120)]
                print(f"  [{m}]: {repr(context)}")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
