import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

filepath = r"js/modules/teams/TeamController.js"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    pos = content.find('showTeamDetail')
    if pos != -1:
        # Guardar en un archivo temporal de scratch los 45.000 caracteres
        out_path = r"scratch/showTeamDetail_full.txt"
        with open(out_path, "w", encoding="utf-8") as f_out:
            f_out.write(content[pos : pos + 45000])
        print(f"Extraído showTeamDetail completo en {out_path}")
    else:
        print("No se encontró showTeamDetail")
else:
    print("No existe el archivo")
