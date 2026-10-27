# -*- coding: utf-8 -*-
"""
Motor de Autenticación y Extracción de Nombres Reales de Playtomic
Utiliza la API nativa de Playtomic (api.app.playtomic.io) para obtener los
jugadores y parejas reales inscritos en cualquier torneo a partir de su ID.
"""

import urllib.request
import urllib.error
import json
import time

PLAYTOMIC_API_BASE = "https://api.app.playtomic.io"

def playtomic_login(email, password):
    """Inicia sesión en la API oficial de Playtomic y obtiene el access_token."""
    url = f"{PLAYTOMIC_API_BASE}/v3/auth/login"
    payload = json.dumps({
        "email": email.strip(),
        "password": password.strip(),
        "requested_user_roles": ["ROLE_CUSTOMER"]
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Playtomic/Android",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")
            user_id = data.get("user_id")
            return {
                "success": True,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_id": user_id
            }
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        return {
            "success": False,
            "code": e.code,
            "error": body
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def fetch_tournament_participants(tournament_id, access_token):
    """Obtiene la lista real de jugadores/equipos inscritos en un torneo de Playtomic."""
    url = f"{PLAYTOMIC_API_BASE}/v2/tournaments/{tournament_id}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "User-Agent": "Playtomic/Android",
            "Accept": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return {"success": True, "data": data}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        return {"success": False, "code": e.code, "error": body}
    except Exception as e:
        return {"success": False, "error": str(e)}
