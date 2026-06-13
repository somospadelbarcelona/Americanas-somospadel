# -*- coding: utf-8 -*-
"""
=====================================================================
💬 BOT DE SINCRONIZACIÓN AUTOMÁTICA: WHATSAPP -> SOMOS PÁDEL APP
=====================================================================
Este bot corre en segundo plano en tu servidor o PC de administración.
Monitorea el grupo de WhatsApp "Partidas abiertas 🎾😜" en tiempo real,
extrae los enlaces de Playtomic, los limpia y los sube a Firestore.

---------------------------------------------------------------------
🛠️ INSTRUCCIONES DE INSTALACIÓN Y CORRIDA EN WINDOWS:
---------------------------------------------------------------------
1. Instala Python si no lo tienes (versión 3.10 o superior).
2. Instala Selenium y las librerías necesarias ejecutando en tu consola:
   pip install selenium requests unicodedata2

3. Ejecuta este script desde la consola de Windows:
   python tools/whatsapp_playtomic_bot.py

4. Al arrancar, se abrirá una ventana de Chrome con WhatsApp Web de forma visible.
5. ESCANEA el código QR con el teléfono del club una sola vez.
6. El bot localizará el grupo "Partidas abiertas 🎾😜" y empezará a escuchar.
=====================================================================
"""

import os
import re
import time
import json
import urllib.request
import unicodedata
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# =====================================================================
# CONFIGURACIÓN CORE
# =====================================================================
PROJECT_ID = "americanas-somospadel"
GROUP_NAME = "Partidas abiertas" # Nombre del grupo a buscar en WhatsApp
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/open_matches"

# Opcional: Coloca aquí tu clave de API de Gemini si deseas usar IA en texto caótico.
# Si está vacía, el bot utilizará el extractor determinista por Expresiones Regulares.
GEMINI_API_KEY = ""

def normalize_name(name):
    if not name:
        return ""
    name = unicodedata.normalize('NFD', name)
    name = "".join([c for c in name if unicodedata.category(c) != 'Mn'])
    return name.lower().strip()

def parse_with_regex(text, playtomic_url):
    """
    Parser determinista ultra-robusto diseñado específicamente para el formato
    de compartición de partidas de Playtomic de Somos Pádel BCN.
    """
    print("[BOT] Corriendo Extractor por Expresiones Regulares...")
    club = "Somos Pádel BCN"
    date_str = time.strftime("%Y-%m-%d")
    time_str = "19:00"
    duration = 90
    level_min = 3.0
    level_max = 3.5
    players = []
    spots_needed = 1

    # 1. Extraer Club
    club_match = re.search(r'PARTIDO EN\s+([^\n💪👑🎾]+)', text, re.IGNORECASE)
    if club_match:
        club = club_match[1].strip()
    else:
        location_line = [l for l in text.split('\n') if '📍' in l]
        if location_line:
            club = location_line[0].replace('📍', '').strip()

    # 2. Extraer Fecha, Hora y Duración
    date_line = [l for l in text.split('\n') if '📅' in l]
    if date_line:
        line = date_line[0]
        # Duración
        dur_match = re.search(r'(\d+)\s*min', line, re.IGNORECASE)
        if dur_match:
            duration = int(dur_match[1])
        
        # Hora (HH:MM)
        time_match = re.search(r'(\d{2}:\d{2})', line)
        if time_match:
            time_str = time_match[1]
        
        # Fecha (d/m/yyyy)
        date_match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', line)
        if date_match:
            day = date_match[1].zfill(2)
            month = date_match[2].zfill(2)
            year = date_match[3]
            date_str = f"{year}-{month}-{day}"

    # 3. Extraer Nivel
    level_line = [l for l in text.split('\n') if '📊' in l]
    if level_line:
        levels = level_line[0].replace('📊', '').split('-')
        levels = [l.strip() for l in levels]
        try:
            if len(levels) >= 2:
                level_min = float(levels[0])
                level_max = float(levels[1])
            elif len(levels) == 1:
                level_min = float(levels[0])
                level_max = level_min + 0.5
        except ValueError:
            pass

    # 4. Extraer Jugadores y Plazas Libres
    blank_count = 0
    for line in text.split('\n'):
        if '✔️' in line or '✔' in line:
            clean = line.replace('✔️', '').replace('✔', '').strip()
            if '??' in clean or clean == '?' or not clean:
                blank_count += 1
            else:
                players.append(clean)

    if blank_count > 0:
        spots_needed = blank_count
    elif len(players) > 0:
        spots_needed = max(0, 4 - len(players))

    return {
        "club": club,
        "date": date_str,
        "time": time_str,
        "duration": duration,
        "level_min": level_min,
        "level_max": level_max,
        "players": players,
        "spots_needed": spots_needed,
        "playtomic_url": playtomic_url,
        "original_text": text
    }

def save_to_firestore(document_id, data):
    """
    Guarda los datos ordenados en Firestore de forma directa utilizando
    el Endpoint REST público y una llamada HTTP PATCH segura.
    """
    url = f"{FIRESTORE_URL}/{document_id}?updateMask.fieldPaths=club&updateMask.fieldPaths=date&updateMask.fieldPaths=time&updateMask.fieldPaths=duration&updateMask.fieldPaths=level_min&updateMask.fieldPaths=level_max&updateMask.fieldPaths=players&updateMask.fieldPaths=spots_needed&updateMask.fieldPaths=playtomic_url&updateMask.fieldPaths=original_text&updateMask.fieldPaths=status"
    
    # Construcción del formato especial de Firestore REST
    players_list_fs = [{"stringValue": p} for p in data["players"]]
    
    payload = {
        "fields": {
            "club": { "stringValue": data["club"] },
            "date": { "stringValue": data["date"] },
            "time": { "stringValue": data["time"] },
            "duration": { "integerValue": str(data["duration"]) },
            "level_min": { "doubleValue": data["level_min"] },
            "level_max": { "doubleValue": data["level_max"] },
            "players": { "arrayValue": { "values": players_list_fs } },
            "spots_needed": { "integerValue": str(data["spots_needed"]) },
            "playtomic_url": { "stringValue": data["playtomic_url"] },
            "original_text": { "stringValue": data["original_text"] },
            "status": { "stringValue": "active" }
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            print(f"[OK] Sincronizado en Firebase Firestore: {data['club']} ({data['date']} {data['time']})")
    except Exception as e:
        print(f"[ERROR] No se pudo guardar en Firestore: {e}")

def start_bot():
    print("[BOT] Levantando navegador Chrome...")
    
    chrome_options = Options()
    # Usar datos de sesión local para no tener que escanear el QR cada vez que se reinicie el bot
    user_data_dir = os.path.join(os.path.expanduser("~"), "AppData", "Local", "Google", "Chrome", "User Data", "SomosPadelBot")
    chrome_options.add_argument(f"user-data-dir={user_data_dir}")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.get("https://web.whatsapp.com")
    
    print("\n⚠️  [ATENCIÓN]: Escanea el código QR de WhatsApp Web si se solicita en la ventana de Chrome.")
    
    # Esperar hasta que se inicie sesión y cargue la barra de búsqueda lateral
    try:
        WebDriverWait(driver, 120).until(
            EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"][@data-tab="3"]'))
        )
        print("[OK] Sesión de WhatsApp iniciada de forma exitosa.")
    except Exception as e:
        print("[ERROR] Timeout al esperar inicio de sesión de WhatsApp Web.")
        driver.quit()
        return

    # Buscar el grupo por su nombre
    try:
        search_box = driver.find_element(By.XPATH, '//div[@contenteditable="true"][@data-tab="3"]')
        search_box.clear()
        search_box.send_keys(GROUP_NAME)
        time.sleep(3)
        
        # Hacer clic en el grupo en la lista
        group_xpath = f'//span[@title="{GROUP_NAME}"]'
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.XPATH, group_xpath))
        )
        group_item = driver.find_element(By.XPATH, group_xpath)
        group_item.click()
        print(f"[OK] Grupo '{GROUP_NAME}' abierto y seleccionado. Escuchando mensajes...")
    except Exception as e:
        print(f"[ERROR] No se pudo encontrar o abrir el grupo '{GROUP_NAME}': {e}")
        driver.quit()
        return

    # Bucle infinito de escucha de mensajes entrantes
    processed_messages = set()
    
    # Escaneamos los mensajes que ya están en el chat para no reprocesarlos
    try:
        initial_messages = driver.find_elements(By.XPATH, '//div[contains(@class, "message-in")]')
        for msg in initial_messages:
            try:
                msg_text = msg.find_element(By.XPATH, './/span[contains(@class, "selectable-text")]').text
                processed_messages.add(hash(msg_text))
            except:
                pass
        print(f"[OK] Inicializados {len(processed_messages)} mensajes anteriores en memoria para omitir duplicados.")
    except:
        pass

    try:
        while True:
            # Buscar todos los mensajes entrantes (clase message-in)
            incoming_messages = driver.find_elements(By.XPATH, '//div[contains(@class, "message-in")]')
            if incoming_messages:
                last_msg = incoming_messages[-1]
                try:
                    text_element = last_msg.find_element(By.XPATH, './/span[contains(@class, "selectable-text")]')
                    text = text_element.text
                    msg_hash = hash(text)
                    
                    if msg_hash not in processed_messages:
                        processed_messages.add(msg_hash)
                        print(f"\n💬 [NUEVO MENSAJE]: {text.split('\n')[0]}...")
                        
                        # Buscar enlace de Playtomic
                        playtomic_regex = r"https?://(?:app\.)?playtomic\.io/matches/([a-zA-Z0-9\-]+)"
                        match = re.search(playtomic_regex, text, re.IGNORECASE)
                        
                        if match:
                            playtomic_url = match[0]
                            match_id = match[1]
                            document_id = f"playtomic_{match_id}"
                            print(f"[DETECTOR] Enlace de Playtomic interceptado: {playtomic_url}")
                            
                            # Parsear
                            data = parse_with_regex(text, playtomic_url)
                            
                            # Guardar en Firestore
                            save_to_firestore(document_id, data)
                        else:
                            print("[DETECTOR] Mensaje sin enlace de Playtomic. Ignorado.")
                            
                except Exception as msg_err:
                    # Omitir errores de mensajes que no tienen texto (como imágenes o stickers)
                    pass
            
            time.sleep(1) # Dormir 1 segundo entre chequeos para no saturar la CPU
            
    except KeyboardInterrupt:
        print("\n[BOT] Apagando bot de forma ordenada...")
    finally:
        driver.quit()

if __name__ == "__main__":
    start_bot()
