# 1. Update admin.html
with open('admin.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all calls to openQuickPlaytomicSyncSelector with loadAdminView('playtomic')
text = text.replace('window.openQuickPlaytomicSyncSelector()', "loadAdminView('playtomic')")
text = text.replace('openQuickPlaytomicSyncSelector()', "loadAdminView('playtomic')")

# Hide old modal permanently
text = text.replace(
    'id="playtomic-sync-modal" class="modal-overlay hidden"',
    'id="playtomic-sync-modal" class="modal-overlay hidden" style="display: none !important;"'
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update js/modules/admin-americanas.js
with open('js/modules/admin-americanas.js', 'r', encoding='utf-8') as f:
    text_aa = f.read()

override_code = '''
// REDIRECCIÓN 100% AUTOMÁTICA AL CENTRO DE CONTROL PLAYTOMIC (CERO MODALES MANUALES)
window.openQuickPlaytomicSyncSelector = function() {
    if (typeof window.loadAdminView === 'function') {
        window.loadAdminView('playtomic');
    }
};

window.openPlaytomicSyncModal = function() {
    if (typeof window.loadAdminView === 'function') {
        window.loadAdminView('playtomic');
    }
};
'''

# Replace openQuickPlaytomicSyncSelector definition
import re
text_aa = re.sub(
    r'window\.openQuickPlaytomicSyncSelector\s*=\s*async\s*function\s*\(\)\s*\{[\s\S]*?\n\};',
    'window.openQuickPlaytomicSyncSelector = function() { if (typeof window.loadAdminView === "function") window.loadAdminView("playtomic"); };',
    text_aa
)

# Replace openPlaytomicSyncModal definition
text_aa = re.sub(
    r'window\.openPlaytomicSyncModal\s*=\s*async\s*function\s*\([^)]*\)\s*\{[\s\S]*?\n\};',
    'window.openPlaytomicSyncModal = function() { if (typeof window.loadAdminView === "function") window.loadAdminView("playtomic"); };',
    text_aa
)

with open('js/modules/admin-americanas.js', 'w', encoding='utf-8') as f:
    f.write(text_aa)

print("SUCCESS: manual modal killed and redirected to modern playtomic view!")
