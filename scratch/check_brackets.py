import sys

def check_brackets(filepath):
    print(f"Checking brackets for {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            content = f.read()
            
    stack = []
    lines = content.split('\n')
    
    in_string = False
    string_char = None
    in_line_comment = False
    in_block_comment = False
    
    for line_idx, line in enumerate(lines):
        line_num = line_idx + 1
        i = 0
        n = len(line)
        in_line_comment = False
        while i < n:
            char = line[i]
            
            # Block comment checks
            if in_block_comment:
                if i + 1 < n and char == '*' and line[i+1] == '/':
                    in_block_comment = False
                    i += 2
                    continue
                i += 1
                continue
                
            # Line comment check
            if not in_string and not in_block_comment:
                if i + 1 < n and char == '/' and line[i+1] == '/':
                    break # Skip rest of line
                if i + 1 < n and char == '/' and line[i+1] == '*':
                    in_block_comment = True
                    i += 2
                    continue
            
            # String literals checks
            if char in ['"', "'", '`'] and (i == 0 or line[i-1] != '\\'):
                if in_string:
                    if char == string_char:
                        in_string = False
                        string_char = None
                else:
                    in_string = True
                    string_char = char
                i += 1
                continue
                
            if in_string:
                i += 1
                continue
                
            # Brackets balance
            if char in ['{', '[', '(']:
                stack.append((char, line_num, i, line[:i+1]))
            elif char in ['}', ']', ')']:
                if not stack:
                    print(f"Error: Unexpected closing character '{char}' at line {line_num}, col {i}")
                    print(f"Line: {line}")
                    return False
                top_char, top_line, top_col, top_text = stack.pop()
                if (char == '}' and top_char != '{') or \
                   (char == ']' and top_char != '[') or \
                   (char == ')' and top_char != '('):
                    print(f"Error: Mismatched opening '{top_char}' at line {top_line} with closing '{char}' at line {line_num}")
                    print(f"Opening line: {lines[top_line-1]}")
                    print(f"Closing line: {line}")
                    return False
            i += 1
            
    if stack:
        print(f"Error: Unmatched opening brackets left at end of file:")
        for top_char, top_line, top_col, top_text in stack[:10]:
            print(f" - Unmatched '{top_char}' at line {top_line}")
        return False
        
    print("Brackets are fully balanced! No brace/bracket syntax issues found.")
    return True

if __name__ == '__main__':
    check_brackets('js/modules/dashboard/DashboardView_hotfix.js')
