import os
import re

pattern = re.compile(r"\.split\(['\"]\s*['\"]\)")

def search_files(dir_path):
    for root, dirs, files in os.walk(dir_path):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'brain', '.antigravity')]
        for file in files:
            if file.endswith('.js') or file.endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        for idx, line in enumerate(f):
                            if pattern.search(line):
                                print(f"{file_path}:{idx + 1}: {line.strip()}")
                except Exception as e:
                    pass

search_files('.')
