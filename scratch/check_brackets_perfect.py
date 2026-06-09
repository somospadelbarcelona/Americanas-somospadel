import sys

def analyze_js(filepath):
    print(f"Parsing JS file character-by-character: {filepath}")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            code = f.read()

    i = 0
    n = len(code)
    
    # Stack stores (char, line, col, line_text)
    stack = []
    
    # State tracking stack: contains states like 'normal', 'string_single', 'string_double', 'template_literal', 'line_comment', 'block_comment'
    state_stack = ['normal']
    
    line_num = 1
    col_num = 1
    
    # For printing line context on error
    lines = code.split('\n')
    
    def get_line_text(l_num):
        if 1 <= l_num <= len(lines):
            return lines[l_num - 1]
        return ""

    while i < n:
        char = code[i]
        curr_state = state_stack[-1]
        
        # Track line and column numbers
        next_line = line_num
        next_col = col_num + 1
        if char == '\n':
            next_line = line_num + 1
            next_col = 1

        if curr_state == 'normal':
            # Check comment transitions
            if char == '/' and i + 1 < n and code[i+1] == '/':
                state_stack.append('line_comment')
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
            elif char == '/' and i + 1 < n and code[i+1] == '*':
                state_stack.append('block_comment')
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
            elif char == '"':
                state_stack.append('string_double')
            elif char == "'":
                state_stack.append('string_single')
            elif char == '`':
                state_stack.append('template_literal')
            elif char == '/' and i + 1 < n and code[i+1] not in ['/', '*', ' ']:
                # We need to distinguish regex literal from division operator.
                # In JS, regex literal is typically preceded by: =, (, [, ,, ?, :, !, &, |, ~, ^, *, +, -, %, <, >, or keyword
                # Let's peek backwards to see the last non-whitespace character.
                j = i - 1
                while j >= 0 and code[j] in [' ', '\t', '\n', '\r']:
                    j -= 1
                last_char = code[j] if j >= 0 else ''
                # If last_char is an operator or starter, it's a regex
                if last_char in ['=', '(', '[', ',', '?', ':', '!', '&', '|', '~', '^', '*', '+', '-', '%', '<', '>', ';', '{', '}']:
                    state_stack.append('regex')
                    i += 1
                    col_num += 1
                    continue
                else:
                    # Treat as division
                    pass
            
            if char in ['{', '[', '(']:
                stack.append((char, line_num, col_num, get_line_text(line_num)))
            elif char in ['}', ']', ')']:
                if not stack:
                    print(f"ERROR: Unexpected closing '{char}' at line {line_num}, column {col_num}")
                    print(f"Line: {get_line_text(line_num).strip()}")
                    return False
                
                top_char, top_line, top_col, top_text = stack.pop()
                
                # Check mismatch
                if (char == '}' and top_char not in ['{', '${']) or \
                   (char == ']' and top_char != '[') or \
                   (char == ')' and top_char != '('):
                    print(f"ERROR: Mismatch! Opened '{top_char}' at line {top_line} (text: '{top_text.strip()}') but closed with '{char}' at line {line_num} (text: '{get_line_text(line_num).strip()}')")
                    print("\n--- STACK CONTENTS (Last 15) ---")
                    for s_char, s_line, s_col, s_txt in stack[-15:]:
                        print(f"  '{s_char}' at L{s_line}: {s_txt.strip()[:80]}")
                    return False
                
                if char == '}' and top_char == '${':
                    state_stack.pop() # pop 'normal' to go back to 'template_literal'

        elif curr_state == 'line_comment':
            if char == '\n':
                state_stack.pop()
        elif curr_state == 'block_comment':
            if char == '*' and i + 1 < n and code[i+1] == '/':
                state_stack.pop()
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
        elif curr_state == 'string_double':
            if char == '\\': # escape
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
            elif char == '"':
                state_stack.pop()
        elif curr_state == 'string_single':
            if char == '\\': # escape
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
            elif char == "'":
                state_stack.pop()
        elif curr_state == 'template_literal':
            if char == '\\': # escape
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
            elif char == '`':
                state_stack.pop()
            elif char == '$' and i + 1 < n and code[i+1] == '{':
                state_stack.append('normal')
                stack.append(('${', line_num, col_num, get_line_text(line_num)))
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
        elif curr_state == 'regex':
            if char == '\\': # escape inside regex
                i += 2
                col_num += 2
                line_num = next_line
                col_num = next_col
                continue
            elif char == '/': # end of regex
                state_stack.pop()

        i += 1
        line_num = next_line
        col_num = next_col

    if stack:
        print(f"ERROR: Unclosed brackets left:")
        for top_char, top_line, top_col, top_text in stack[:20]:
            print(f" - Unclosed '{top_char}' at line {top_line}: {top_text.strip()[:80]}")
        return False
        
    print("SUCCESS: Brackets are perfectly balanced!")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python check_brackets_perfect.py <filepath>")
    else:
        analyze_js(sys.argv[1])
