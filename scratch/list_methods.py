import re

def extract_methods(filepath):
    methods = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find method definitions inside the class DashboardView
    # Match strings like: "    async methodName(params) {" or "    methodName(params) {"
    pattern = re.compile(r'^\s+(async\s+)?([a-zA-Z0-9_]+)\s*\([^\)]*\)\s*\{', re.MULTILINE)
    for match in pattern.finditer(content):
        methods.append(match.group(2))
    return methods

methods_orig = extract_methods('js/modules/dashboard/DashboardView.js')
methods_hotfix = extract_methods('js/modules/dashboard/DashboardView_hotfix.js')

print("=== ORIGINAL METHODS ===")
print(sorted(list(set(methods_orig))))
print(f"Total: {len(methods_orig)}")

print("\n=== HOTFIX METHODS ===")
print(sorted(list(set(methods_hotfix))))
print(f"Total: {len(methods_hotfix)}")

print("\n=== METHODS ONLY IN HOTFIX ===")
print(sorted(list(set(methods_hotfix) - set(methods_orig))))

print("\n=== METHODS ONLY IN ORIGINAL ===")
print(sorted(list(set(methods_orig) - set(methods_hotfix))))
