import os

filepath = r"js/modules/teams/TeamController.js"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    for idx, line in enumerate(lines):
        if 'id="tab-tactica"' in line:
            print(f"tab-tactica empieza en línea: {idx+1}")
        if 'id="p1-player-a"' in line:
            print(f"p1-player-a está en línea: {idx+1}")
        if 'id="court-p1-b"' in line:
            print(f"court-p1-b está en línea: {idx+1}")
        if 'id="court-p3-a"' in line:
            print(f"court-p3-a está en línea: {idx+1}")
else:
    print("No existe el archivo")
