import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

filepath = r"scratch/showTeamDetail_full.txt"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Buscar 'tab-tactica'
    start_pos = content.find('id="tab-tactica"')
    if start_pos != -1:
        # Encontrar el final buscando el siguiente tab (por ejemplo, tab-stats o el cierre del contenedor principal)
        # Vamos a extraer unos 18.000 caracteres que deberían cubrir toda la sección táctica
        section = content[start_pos - 100 : start_pos + 18000]
        out_path = r"scratch/tab_tactica_html.txt"
        with open(out_path, "w", encoding="utf-8") as f_out:
            f_out.write(section)
        print(f"Extraído el bloque tab-tactica en {out_path}")
    else:
        print("No se encontró id=\"tab-tactica\"")
else:
    print("No existe el archivo showTeamDetail_full.txt")
