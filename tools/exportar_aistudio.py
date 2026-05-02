import os

def export_workspace():
    exclude_dirs = {'.git', 'node_modules', 'git_portable', 'node_portable', 'img', '__pycache__', '.antigravity'}
    include_exts = {'.js', '.css', '.html', '.py', '.md', '.json'}
    exclude_files = {'players_data.json', 'all_players.json', 'package-lock.json'}
    
    out_path = r'C:\Users\acoscolin\OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio\ALEX\CODIGO_AMERICANAS_AISTUDIO.txt'
    
    with open(out_path, 'w', encoding='utf-8') as outfile:
        outfile.write("### REPOSITORIO DE AMERICANAS PARA AI STUDIO ###\n\n")
        
        for root, dirs, files in os.walk('.'):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if any(file.endswith(ext) for ext in include_exts) and file not in exclude_files:
                    filepath = os.path.join(root, file)
                    # skip large files like big sqlite dumps if any
                    if os.path.getsize(filepath) > 1024 * 500: # 500kb
                        continue
                    
                    outfile.write(f"\n=========================================\n")
                    outfile.write(f"FILE: {filepath.replace('.\\\\', '')}\n")
                    outfile.write(f"=========================================\n")
                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read() + "\n")
                    except Exception as e:
                        try:
                            # fallback to latin-1 or ansi
                            with open(filepath, 'r', encoding='latin-1') as infile:
                                outfile.write(infile.read() + "\n")
                        except Exception as e2:
                            outfile.write(f"// NO SE PUDO LEER EL ARCHIVO: {e2}\n")

if __name__ == '__main__':
    export_workspace()
    print("Exportacion completada en CODIGO_AMERICANAS_AISTUDIO.txt en la carpeta ALEX.")
