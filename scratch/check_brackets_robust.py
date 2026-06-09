import re

def strip_js_features(js_code):
    # Strip comments
    js_code = re.sub(r'/\*.*?\*/', '', js_code, flags=re.DOTALL)
    js_code = re.sub(r'//.*', '', js_code)
    # Replace strings to avoid matching brackets inside them
    js_code = re.sub(r'"(\\.|[^"\\])*"', '""', js_code)
    js_code = re.sub(r"'(\\.|[^'\\])*'", "''", js_code)
    # We replace template literals but preserve newlines to keep line numbers accurate!
    def repl_backticks(m):
        return '`' + '\n' * m.group(0).count('\n') + '`'
    js_code = re.sub(r'`(\\.|[^`\\])*`', repl_backticks, js_code, flags=re.DOTALL)
    # Regex literals
    js_code = re.sub(r'/(\\.|[^/\\])+/[gimy]*', '/regex/', js_code)
    return js_code

def check_balanced(filepath):
    print(f"Checking balanced brackets for: {filepath}")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            code = f.read()
            
    clean_code = strip_js_features(code)
    
    stack = []
    lines = clean_code.split('\n')
    
    # Track matching history to debug
    history = []
    
    for line_idx, line in enumerate(lines):
        line_num = line_idx + 1
        for col_idx, char in enumerate(line):
            if char in ['{', '[', '(']:
                stack.append((char, line_num, col_idx, line))
            elif char in ['}', ']', ')']:
                if not stack:
                    print(f"ERROR: Unexpected closing '{char}' at line {line_num}, column {col_idx}")
                    print(f"Line content: {line.strip()}")
                    return False
                top_char, top_line, top_col, top_line_text = stack.pop()
                
                # Check mismatch
                if (char == '}' and top_char != '{') or \
                   (char == ']' and top_char != '[') or \
                   (char == ')' and top_char != '('):
                    print(f"ERROR: Mismatch! Opened '{top_char}' at line {top_line} (text: '{top_line_text.strip()}') but closed with '{char}' at line {line_num} (text: '{line.strip()}')")
                    print("\n--- CURRENT STACK ---")
                    for s_char, s_line, s_col, s_text in stack[-30:]:
                        print(f"  '{s_char}' at line {s_line}: {s_text.strip()[:80]}")
                    print("\n--- RECENT SUCCESSFUL MATCHES ---")
                    for match_info in history[-20:]:
                        print(match_info)
                    return False
                else:
                    history.append(f"Matched '{top_char}' (L{top_line}) with '{char}' (L{line_num})")
                    
    if stack:
        print(f"ERROR: Unclosed brackets left:")
        for top_char, top_line, top_col, top_text in stack:
            print(f" - Unclosed '{top_char}' at line {top_line}: {top_text.strip()[:80]}")
        return False
        
    print("SUCCESS: Brackets are perfectly balanced!")
    return True

if __name__ == '__main__':
    check_balanced('js/modules/dashboard/DashboardView_hotfix.js')
