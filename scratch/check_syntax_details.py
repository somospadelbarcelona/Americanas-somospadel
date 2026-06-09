import re

with open('js/modules/dashboard/DashboardView_hotfix.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = "".join(lines)
pattern = re.compile(r'^(\s+)(async\s+)?([a-zA-Z0-9_]+)\s*\([^\)]*\)\s*\{', re.MULTILINE)

def clean_non_ascii(text):
    return text.encode('ascii', 'ignore').decode('ascii')

for match in pattern.finditer(content):
    method_name = match.group(3)
    if method_name in ['for', 'if', 'while', 'switch', 'catch']:
        start_pos = match.start()
        line_num = content[:start_pos].count('\n') + 1
        
        # Only focus on 'for' to pinpoint it
        if method_name == 'for':
            print(f"Match '{method_name}' found at line {line_num}:")
            print(f"Line content: {clean_non_ascii(lines[line_num-1].strip())}")
            start_line = max(0, line_num - 3)
            end_line = min(len(lines), line_num + 5)
            for i in range(start_line, end_line):
                print(f"  {i+1}: {clean_non_ascii(lines[i])}", end='')
            print("-" * 40)
