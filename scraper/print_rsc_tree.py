# -*- coding: utf-8 -*-
with open('scraper/script_14.json', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('0:{"P":null')
if idx != -1:
    print('Found RSC payload root:')
    print(text[idx:idx+4000])
