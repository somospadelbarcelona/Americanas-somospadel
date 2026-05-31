import os

filepath = r"js/modules/teams/TeamController.js"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    for idx, line in enumerate(lines):
        if 'pairs.forEach((p, idx) => {' in line:
            print(f"pairs.forEach empieza en línea: {idx+1}")
            # Mostrar las siguientes 40 líneas
            for i in range(idx, min(len(lines), idx + 40)):
                print(f"{i+1}: {lines[i]}", end="")
            break
else:
    print("No existe el archivo")
