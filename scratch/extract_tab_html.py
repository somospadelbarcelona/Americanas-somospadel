import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

filepath = r"js/modules/teams/TeamController.js"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    pos = content.find('id="tab-tactica"')
    if pos != -1:
        # Extraer 12000 caracteres
        print(content[pos - 50 : pos + 12000])
else:
    print("No existe el archivo")
