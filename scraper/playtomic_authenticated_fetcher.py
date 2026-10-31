# -*- coding: utf-8 -*-
"""
Motor de Autenticación y Extracción de Nombres Reales de Playtomic
Utiliza la API oficial de Playtomic Manager (manager.playtomic.io/api) para obtener los
jugadores, parejas, nombres y fotos reales inscritos en cualquier torneo a partir de su ID.
"""

import urllib.request
import urllib.error
import json
import time

PLAYTOMIC_API_BASE = "https://manager.playtomic.io/api"

def playtomic_login(email="somospadeleugestion@gmail.com", password="Factor2000!"):
    """Inicia sesión en la API oficial de Playtomic y obtiene el access_token."""
    url = f"{PLAYTOMIC_API_BASE}/v3/auth/login"
    payload = json.dumps({
        "requested_user_scopes": [{"role": "ROLE_CUSTOMER", "scope_id": None}],
        "email": email.strip(),
        "password": password.strip()
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "x-requested-with": "com.playtomic.manager 1.328.0+build.5972",
            "referer": "https://manager.playtomic.io/auth/login"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json, text/plain, */*",
            "x-requested-with": "com.playtomic.manager 1.328.0+build.5972"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return {"success": True, "data": data}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        return {"success": False, "code": e.code, "error": body}
    except Exception as e:
        return {"success": False, "error": str(e)}

