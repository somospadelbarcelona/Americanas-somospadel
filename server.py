# -*- coding: utf-8 -*-
"""
Servidor Local de SomosPadel BCN con Soporte para Sincronización Playtomic en Tiempo Real
Permite servir la web en http://localhost:8000 y ejecutar /api/sync-playtomic en 1 clic.
"""
import http.server
import socketserver
import os
import json
import sys
import urllib.parse

try:
    if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

def safe_print(msg):
    try:
        if sys.stdout:
            print(msg)
    except Exception:
        pass

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class SomosPadelHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/sync-playtomic'):
            self.handle_playtomic_sync()
            return
        if self.path.startswith('/api/delete-playtomic'):
            self.handle_playtomic_delete()
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/sync-playtomic'):
            self.handle_playtomic_sync()
            return
        if self.path.startswith('/api/delete-playtomic'):
            self.handle_playtomic_delete()
            return
        super().do_POST()

    def handle_playtomic_delete(self):
        safe_print("\n[API LOCAL] Peticion de Eliminacion Total Playtomic recibida...")
        try:
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            uuid = qs.get('uuid', [None])[0]
            doc_id = qs.get('id', [None])[0]

            if not uuid and not doc_id and self.headers.get('Content-Length'):
                try:
                    length = int(self.headers.get('Content-Length'))
                    body = self.rfile.read(length)
                    data = json.loads(body.decode('utf-8'))
                    uuid = data.get('uuid')
                    doc_id = data.get('id')
                except Exception:
                    pass

            from scraper.playtomic_auto_daemon import mark_tournament_deleted
            mark_tournament_deleted(uuid, doc_id)
            response_data = {
                "success": True,
                "message": "Americana eliminada totalmente y bloqueada de futuras sincronizaciones."
            }
            status_code = 200
        except Exception as e:
            safe_print(f"[API LOCAL] Error en delete Playtomic: {e}")
            response_data = {"success": False, "error": str(e)}
            status_code = 500

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.end_headers()
        self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))

    def handle_playtomic_sync(self):
        safe_print("\n[API LOCAL] Peticion de Sincronizacion Playtomic en Tiempo Real recibida...")
        try:
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            uuid = qs.get('uuid', [None])[0]

            if not uuid and self.headers.get('Content-Length'):
                try:
                    length = int(self.headers.get('Content-Length'))
                    body = self.rfile.read(length)
                    data = json.loads(body.decode('utf-8'))
                    uuid = data.get('uuid')
                except Exception:
                    pass

            from scraper.playtomic_auto_daemon import remember_tournament_uuid, unmark_tournament_deleted, run_sync_cycle
            if uuid:
                safe_print(f"[API LOCAL] Registrando UUID de Playtomic solicitado: {uuid}")
                unmark_tournament_deleted(uuid)
                remember_tournament_uuid(uuid)

            results = run_sync_cycle(deep_discovery=True)
            response_data = {
                "success": True,
                "count": len(results) if results else 0,
                "message": f"Sincronización completada: {len(results) if results else 0} americanas oficiales procesadas.",
                "tournaments": results
            }
            status_code = 200
        except Exception as e:
            safe_print(f"[API LOCAL] Error en sync Playtomic: {e}")
            response_data = {
                "success": False,
                "error": str(e)
            }
            status_code = 500

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.end_headers()
        self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    with ReusableTCPServer(("", PORT), SomosPadelHandler) as httpd:
        safe_print("========================================================")
        safe_print(f"  SERVIDOR SOMOSPADEL ACTIVO EN http://localhost:{PORT}")
        safe_print("  API DE SINCRONIZACION PLAYTOMIC DISPONIBLE")
        safe_print("========================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            safe_print("\nDeteniendo servidor...")
            httpd.server_close()
