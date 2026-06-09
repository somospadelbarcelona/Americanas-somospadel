import os

def check_balance(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Skipping {filepath} due to read error: {e}")
        return True

    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    i = 0
    length = len(content)
    line = 1
    col = 1
    
    in_single_comment = False
    in_multi_comment = False
    in_string = False
    string_char = None
    
    open_positions = []
    
    while i < length:
        char = content[i]
        
        # Track line/col
        if char == '\n':
            line += 1
            col = 1
        else:
            col += 1
            
        # Handle escape characters inside strings
        if in_string and char == '\\':
            i += 2
            col += 1
            continue
            
        if in_single_comment:
            if char == '\n':
                in_single_comment = False
            i += 1
            continue
            
        if in_multi_comment:
            if char == '*' and i + 1 < length and content[i + 1] == '/':
                in_multi_comment = False
                i += 2
                col += 1
                continue
            i += 1
            continue
            
        if in_string:
            if char == string_char:
                in_string = False
            i += 1
            continue
            
        # Check comments or regex
        if char == '/' and i + 1 < length:
            if content[i + 1] == '/':
                in_single_comment = True
                i += 2
                col += 1
                continue
            elif content[i + 1] == '*':
                in_multi_comment = True
                i += 2
                col += 1
                continue
            else:
                # regex literal bypass
                newline_idx = content.find('\n', i)
                closing_slash_idx = content.find('/', i + 1)
                if closing_slash_idx != -1 and (newline_idx == -1 or closing_slash_idx < newline_idx):
                    skip_to = i + 1
                    while skip_to < closing_slash_idx:
                        if content[skip_to] == '\\':
                            skip_to += 2
                        else:
                            skip_to += 1
                    closing_slash_idx = content.find('/', skip_to)
                    if closing_slash_idx != -1 and (newline_idx == -1 or closing_slash_idx < newline_idx):
                        col += (closing_slash_idx + 1 - i)
                        i = closing_slash_idx + 1
                        continue
                
        # Check strings
        if char in ['"', "'", '`']:
            in_string = True
            string_char = char
            i += 1
            continue
            
        # Check brackets
        if char in ['(', '{', '[']:
            stack.append(char)
            open_positions.append((char, line, col))
        elif char in [')', '}', ']']:
            if not stack:
                print(f"[ERR] Error in {filepath}: Excess closing '{char}' at line {line}, col {col}")
                return False
            top = stack.pop()
            expected = mapping[char]
            open_pos = open_positions.pop()
            if top != expected:
                print(f"[ERR] Error in {filepath}: Mismatched closing '{char}' at line {line}, col {col}. Expected pair for '{top}' from line {open_pos[1]}, col {open_pos[2]}")
                return False
                
        i += 1
        
    if stack:
        print(f"[ERR] Error in {filepath}: Unclosed openings left:")
        for op, l, c in open_positions:
            print(f"  Unclosed '{op}' from line {l}, col {c}")
        return False
        
    return True

print("Starting scan of all JS files recursively...")
error_count = 0
js_files_scanned = 0

for root, dirs, files in os.walk('js'):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            js_files_scanned += 1
            if not check_balance(filepath):
                error_count += 1

print(f"Scan finished. Scanned {js_files_scanned} files. Found {error_count} syntax balance errors.")
