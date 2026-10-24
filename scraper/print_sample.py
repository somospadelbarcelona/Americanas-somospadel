# -*- coding: utf-8 -*-
with open('scraper/halloween_script.json', 'r', encoding='utf-8') as f:
    text = f.read()

print("Length:", len(text))
print("Start:")
print(text[:1500])
print("="*60)
print("End:")
print(text[-1500:])
