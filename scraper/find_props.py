# -*- coding: utf-8 -*-
with open('scraper/script_14.json', 'r', encoding='utf-8') as f:
    text = f.read()

for word in ['Halloween', '12.48', 'Barcelona', 'El Prat', '28']:
    idx = text.find(word)
    print(f'Keyword {word}: idx={idx}')
    if idx != -1:
        print(text[max(0, idx-100):min(len(text), idx+300)])
        print('='*50)
