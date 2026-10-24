# -*- coding: utf-8 -*-
import re

with open('admin.html', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Fix line 1737 ?? Sincronizar Playtomic
c = re.sub(r'<span class="nav-text">.{0,4}Sincronizar Playtomic</span>', '<span class="nav-text">🎾 Sincronizar Playtomic</span>', c)

# 2. Add Top-Bar Playtomic Sync Button if not already there
if 'id="top-bar-playtomic-btn"' not in c:
    old_top_actions = '<div class="top-actions" style="display:flex; align-items:center; gap:15px;">'
    new_top_actions = '''<div class="top-actions" style="display:flex; align-items:center; gap:10px;">
                    <!-- BOTÓN PLAYTOMIC SYNC DESTACADO -->
                    <button id="top-bar-playtomic-btn" type="button" class="haptic-feedback" onclick="window.openQuickPlaytomicSyncSelector()"
                        title="Sincronizar Jugadores de Playtomic"
                        style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: 7px 14px; border-radius: 20px; font-weight: 900; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; box-shadow: 0 2px 12px rgba(0, 198, 255, 0.45); white-space: nowrap;">
                        <i class="fas fa-sync-alt"></i> <span>🎾 PLAYTOMIC SYNC</span>
                    </button>'''
    if old_top_actions in c:
        c = c.replace(old_top_actions, new_top_actions, 1)
        print('Added top-bar button')
    else:
        print('Warning: old_top_actions not found')

# 3. Add Floating Action Button before </body>
if 'id="floating-playtomic-sync-fab"' not in c:
    fab_btn = '''
    <!-- 🎾 BOTÓN FLOTANTE SINCRONIZAR PLAYTOMIC (SIEMPRE VISIBLE EN TODAS LAS VISTAS) -->
    <button id="floating-playtomic-sync-fab" type="button" onclick="window.openQuickPlaytomicSyncSelector()" 
        title="Sincronizar Jugadores de Playtomic"
        style="position: fixed; bottom: 22px; right: 22px; z-index: 999999; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: #ffffff; border: 2.5px solid #ffffff; border-radius: 50px; padding: 12px 22px; font-weight: 900; font-size: 0.92rem; font-family: 'Outfit', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 30px rgba(0, 198, 255, 0.7), 0 2px 8px rgba(0,0,0,0.3); transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); outline: none;">
        <i class="fas fa-sync-alt fa-spin-hover" style="font-size: 1.1rem;"></i>
        <span>🎾 Sincronizar Playtomic</span>
    </button>
'''
    c = c.replace('</body>', fab_btn + '\n</body>')
    print('Added floating action button')

# 4. Mobile subnav bar
if 'playtomic_sync' not in c:
    c = c.replace(
        "{ view: 'americanas_mgmt', label: 'Americanas', icon: 'fa-calendar-check', isPrimary: true },",
        "{ view: 'americanas_mgmt', label: 'Americanas', icon: 'fa-calendar-check', isPrimary: true },\n            { action: 'playtomic_sync', label: '🎾 Sync Playtomic', icon: 'fa-sync-alt', isPlaytomic: true },"
    )
    print('Added to mobile subnav')

# 5. Bump cache buster for admin-americanas.js
c = re.sub(r'admin-americanas\.js\?v=[^\"]+', 'admin-americanas.js?v=20261024_PLAYTOMIC_SYNC_V6', c)
print('Bumped admin-americanas.js cache buster')

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated admin.html successfully')
