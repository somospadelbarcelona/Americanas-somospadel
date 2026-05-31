import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

filepath = r"js/modules/teams/TeamController.js"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    pos = content.find('court-p1-a')
    if pos != -1:
        # Extraer 3000 caracteres alrededor
        print(content[pos - 1500 : pos + 1500])
else:
    print("No existe el archivo")
