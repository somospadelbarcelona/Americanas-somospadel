import os
import sys

# Forzar codificación utf-8 para la salida estándar
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

files = [
    r"js/modules/teams/TeamController.js",
    r"js/modules/teams/TeamView.js"
]

keywords = ["tactica", "táctica", "pistas", "pista", "alineacion", "alineación", "drag", "drop", "dibujar", "lienzo"]

for filepath in files:
    if os.path.exists(filepath):
        print(f"=== Buscando en {filepath} ===")
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for idx, line in enumerate(lines):
            line_lower = line.lower()
            for kw in keywords:
                if kw in line_lower:
                    # Mostrar la línea y número, codificando de forma segura
                    clean_line = line.strip()[:150]
                    print(f"  Línea {idx+1} ({kw}): {clean_line}")
                    break
    else:
        print(f"No existe el archivo {filepath}")
