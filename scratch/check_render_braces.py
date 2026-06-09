import re

def trace_render_braces(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            lines = f.readlines()
            
    # We trace lines 255 to 686 (1-indexed, so index 254 to 685)
    render_lines = lines[254:686]
    
    full_text = "".join(render_lines)
    
    # Clean comments and strings
    full_text = re.sub(r'/\*.*?\*/', '', full_text, flags=re.DOTALL)
    full_text = re.sub(r'//.*', '', full_text)
    full_text = re.sub(r'"(\\.|[^"\\])*"', '""', full_text)
    full_text = re.sub(r"'(\\.|[^'\\])*'", "''", full_text)
    full_text = re.sub(r'`(\\.|[^`\\])*`', '``', full_text, flags=re.DOTALL)
    # Simple regex cleaning
    full_text = re.sub(r'/([^/\\\n]|\\.)+/[gimy]*', '/regex/', full_text)
    
    stack = []
    text_lines = full_text.split('\n')
    for line_idx, line in enumerate(text_lines):
        line_num = 255 + line_idx
        for col_idx, char in enumerate(line):
            if char == '{':
                stack.append((char, line_num, col_idx, line))
            elif char == '}':
                if not stack:
                    print(f"Error: unexpected '}}' at line {line_num}, col {col_idx} (text: '{line.strip()}')")
                    return
                top_char, top_line, top_col, top_text = stack.pop()
                # print(f"Closed '{top_char}' from line {top_line} with '}}' at line {line_num}")
                
    if stack:
        print(f"FAILED: There are unclosed braces in render method:")
        for char, line, col, text in stack:
            print(f"  Unclosed '{char}' from line {line}: {text.strip()}")
    else:
        print("SUCCESS: render method braces are perfectly balanced!")

if __name__ == '__main__':
    trace_render_braces('js/modules/dashboard/DashboardView_hotfix.js')
