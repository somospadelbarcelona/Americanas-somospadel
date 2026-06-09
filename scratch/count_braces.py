import re

def count_braces(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            content = f.read()
            
    # Strip comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    # Strip double quoted strings
    content = re.sub(r'"(\\.|[^"\\])*"', '""', content)
    # Strip single quoted strings
    content = re.sub(r"'(\\.|[^'\\])*'", "''", content)
    # Strip backtick strings
    content = re.sub(r'`(\\.|[^`\\])*`', '``', content, flags=re.DOTALL)
    
    opens = content.count('{')
    closes = content.count('}')
    
    print(f"Total opens: {opens}")
    print(f"Total closes: {closes}")
    print(f"Diff: {opens - closes}")

if __name__ == '__main__':
    count_braces('js/modules/dashboard/DashboardView.js')
