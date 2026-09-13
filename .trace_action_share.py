import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/modules/dashboard/DashboardView.js', 'r', encoding='utf-8') as f:
    code = f.read()

lines = code.split('\n')
stack = []
i = 0
line = 1
col = 1
n = len(code)

STATE_CODE = 0
STATE_SINGLE_STR = 1
STATE_DOUBLE_STR = 2
STATE_TEMPLATE = 3
STATE_LINE_COMMENT = 4
STATE_BLOCK_COMMENT = 5
STATE_REGEX = 6
state = STATE_CODE
template_depths = []

while i < n:
    ch = code[i]
    if ch == '\n':
        line += 1; col = 1
        if state == STATE_LINE_COMMENT: state = STATE_CODE
        i += 1; continue
    if state == STATE_LINE_COMMENT: i += 1; col += 1; continue
    if state == STATE_BLOCK_COMMENT:
        if ch == '*' and i + 1 < n and code[i+1] == '/':
            state = STATE_CODE; i += 2; col += 2; continue
        i += 1; col += 1; continue
    if state == STATE_SINGLE_STR:
        if ch == '\\': i += 2; col += 2; continue
        if ch == "'": state = STATE_CODE
        i += 1; col += 1; continue
    if state == STATE_DOUBLE_STR:
        if ch == '\\': i += 2; col += 2; continue
        if ch == '"': state = STATE_CODE
        i += 1; col += 1; continue
    if state == STATE_TEMPLATE:
        if ch == '\\': i += 2; col += 2; continue
        if ch == '$' and i + 1 < n and code[i+1] == '{':
            template_depths.append(len(stack))
            stack.append(('${', line, col))
            state = STATE_CODE; i += 2; col += 2; continue
        if ch == '`': state = STATE_CODE
        i += 1; col += 1; continue
    if state == STATE_REGEX:
        if ch == '\\': i += 2; col += 2; continue
        if ch == '[':
            j = i + 1
            while j < n and code[j] != ']':
                if code[j] == '\\': j += 2
                else: j += 1
            col += (j - i); i = j; continue
        if ch == '/':
            state = STATE_CODE; i += 1; col += 1
            while i < n and code[i] in 'gimsuy': i += 1; col += 1
            continue
        i += 1; col += 1; continue

    if ch == '/' and i + 1 < n and code[i+1] == '/': state = STATE_LINE_COMMENT; i += 2; col += 2; continue
    if ch == '/' and i + 1 < n and code[i+1] == '*': state = STATE_BLOCK_COMMENT; i += 2; col += 2; continue
    if ch == '/':
        prev = code[:i].rstrip()
        triggers = set("(=[,:;!&|?{}+-~*^%")
        if not prev or prev[-1] in triggers or (prev.split() and prev.split()[-1] in ['return', 'typeof', 'case', 'delete', 'void', 'yield']):
            state = STATE_REGEX; i += 1; col += 1; continue

    if ch == "'": state = STATE_SINGLE_STR; i += 1; col += 1; continue
    if ch == '"': state = STATE_DOUBLE_STR; i += 1; col += 1; continue
    if ch == '`': state = STATE_TEMPLATE; i += 1; col += 1; continue

    if ch in '({[':
        stack.append((ch, line, col))
        if line >= 814 and line <= 870:
            print(f"PUSH '{ch}' at {line}:{col} -> stack len {len(stack)}")
    elif ch in ')}]':
        top, top_l, top_c = stack.pop()
        if line >= 814 and line <= 870:
            print(f"POP '{top}' (from {top_l}:{top_c}) by '{ch}' at {line}:{col} -> stack len {len(stack)}")

    i += 1; col += 1
