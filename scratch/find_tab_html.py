import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

filepath = r"js/modules/teams/TeamController.js"
if os.path.exists(filepath):
    print("=== Buscando bloque tab-tactica ===")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Buscar el índice de 'id="tab-tactica"' o 'tab-tactica'
    idx = 0
    while True:
        pos = content.find('id="tab-tactica"', idx)
        if pos == -1:
            pos = content.find("'tab-tactica'", idx)
        if pos == -1:
            break
        print(f"Encontrado en posición {pos}:")
        # Mostrar 300 caracteres alrededor
        start = max(0, pos - 100)
        end = min(len(content), pos + 1000)
        print(content[start:end])
        print("-" * 60)
        idx = pos + 1
