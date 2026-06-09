import sys
import os

def search_text(query, filepath):
    print(f"Searching for '{query}' in: {filepath}")
    if not os.path.exists(filepath):
        print("File not found.")
        return
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            lines = f.readlines()
            
    matches = []
    for line_num, line in enumerate(lines, 1):
        if query.lower() in line.lower():
            matches.append((line_num, line.strip()))
            
    print(f"Found {len(matches)} matches:")
    for num, text in matches:
        print(f"Line {num}: {text}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python search_text.py <query> <filepath>")
    else:
        search_text(sys.argv[1], sys.argv[2])
