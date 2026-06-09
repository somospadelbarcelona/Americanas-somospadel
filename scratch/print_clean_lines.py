import re

def strip_js_features(js_code):
    js_code = re.sub(r'/\*.*?\*/', '', js_code, flags=re.DOTALL)
    js_code = re.sub(r'//.*', '', js_code)
    js_code = re.sub(r'"(\\.|[^"\\])*"', '""', js_code)
    js_code = re.sub(r"'(\\.|[^'\\])*'", "''", js_code)
    js_code = re.sub(r'`(\\.|[^`\\])*`', '``', js_code, flags=re.DOTALL)
    js_code = re.sub(r'/(\\.|[^/\\])+/[gimy]*', '/regex/', js_code)
    return js_code

def print_clean_lines(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            code = f.read()
            
    clean_code = strip_js_features(code)
    lines = clean_code.split('\n')
    
    # Print lines from 430 to 470 in the clean code
    start = max(0, 420)
    end = min(len(lines), 480)
    for idx in range(start, end):
        print(f"Clean L{idx+1}: {lines[idx]}")

if __name__ == '__main__':
    print_clean_lines('js/modules/dashboard/DashboardView_hotfix.js')
