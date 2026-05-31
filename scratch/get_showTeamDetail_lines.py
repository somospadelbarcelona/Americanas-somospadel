import os

filepath = r"js/modules/teams/TeamController.js"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    pos = content.find("showTeamDetail(teamId, initialTab = 'liderazgo')")
    if pos != -1:
        # Contar cuántas líneas hay antes de pos
        lines_before = content[:pos].count("\n") + 1
        print(f"showTeamDetail empieza en la línea: {lines_before}")
        
        # Buscar el final de showTeamDetail. showTeamDetail_full.txt tiene 426 líneas,
        # así que contemos las líneas de su contenido y sumémoslas.
        print(f"Termina aproximadamente en la línea: {lines_before + 426}")
    else:
        print("No se encontró showTeamDetail")
else:
    print("No existe el archivo")
