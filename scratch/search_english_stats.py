import os
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.join(base_dir, '..')

print("--- BUSCANDO TEXTOS DE VICTORIAS EN INGLÉS ---")
keywords = ["wins", "losses", "played", "won", "lost"]
extensions = [".js", ".html"]

for root, dirs, files in os.walk(project_dir):
    # Excluir carpetas irrelevantes
    if any(p in root for p in [".git", ".agent", ".antigravity", "node_modules", "chrome_data"]):
        continue
    for file in files:
        if any(file.endswith(ext) for ext in extensions):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Buscar palabras clave completas
                for kw in keywords:
                    pattern = r'\b' + re.escape(kw) + r'\b'
                    matches = list(re.finditer(pattern, content, re.IGNORECASE))
                    if matches:
                        rel_path = os.path.relpath(file_path, project_dir)
                        print(f"Archivo: {rel_path} - Coincidencia de '{kw}' ({len(matches)} veces):")
                        # Imprimir las primeras 2 coincidencias como ejemplo
                        for m in matches[:2]:
                            start = max(0, m.start() - 40)
                            end = min(len(content), m.end() + 40)
                            snippet = content[start:end].replace('\n', ' ').strip()
                            print(f"  Snippet: ... {snippet} ...")
            except Exception as e:
                pass
