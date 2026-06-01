import os

workspace_dir = r"c:\Users\acoscolin\OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio\ALEX\AMERICANAS"
output_file = os.path.join(workspace_dir, "scratch", "menu_findings.txt")

files_to_search = [
    os.path.join(workspace_dir, "index.html"),
    os.path.join(workspace_dir, "js", "app.js"),
    os.path.join(workspace_dir, "js", "core", "Router.js")
]

with open(output_file, 'w', encoding='utf-8') as out:
    for filepath in files_to_search:
        if os.path.exists(filepath):
            out.write(f"\n--- BUSCANDO EN {os.path.basename(filepath)} ---\n")
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            for idx, line in enumerate(lines):
                line_lower = line.lower()
                # Check for routing or tab keywords
                if 'ranking' in line_lower or 'tab' in line_lower or 'nav' in line_lower or 'menu' in line_lower:
                    # Let's write the matching line safely
                    out.write(f"Línea {idx+1}: {line.strip()}\n")
        else:
            out.write(f"No existe: {filepath}\n")

print("Busqueda completada y guardada en scratch/menu_findings.txt")
