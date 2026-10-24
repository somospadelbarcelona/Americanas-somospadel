# -*- coding: utf-8 -*-
with open('scraper/script_14.json', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('46011a01-b51f-4ffb-876e-e7eb7e51c1ff')
while idx != -1:
    print('Match at:', idx)
    print(text[idx-50:idx+800])
    print('='*50)
    idx = text.find('46011a01-b51f-4ffb-876e-e7eb7e51c1ff', idx+1)
