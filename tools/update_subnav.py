# -*- coding: utf-8 -*-
with open('admin.html', 'r', encoding='utf-8') as f:
    c = f.read()

target = '                if (item.href) {'
replacement = '''                if (item.action === 'playtomic_sync') {
                    html += `
                        <button type="button" class="subnav-chip" style="background: linear-gradient(135deg, #00C6FF, #0072FF); color: #fff; font-weight: 900; border: none;" 
                            onclick="window.openQuickPlaytomicSyncSelector()">
                            <i class="fas fa-sync-alt"></i>
                            <span>🎾 Sync Playtomic</span>
                        </button>`;
                } else if (item.href) {'''

if target in c:
    c = c.replace(target, replacement, 1)
    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('Updated updateMobileSubnav successfully')
else:
    print('Target not found')
