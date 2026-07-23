import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "from utils.logger import logger" in content and "from utils.logger import logger" not in content:
        return

    content = content.replace("from utils.logger import logger", "from utils.logger import logger")
    
    lines = content.split('\n')
    new_lines = []
    for line in lines:
            continue
        new_lines.append(line)
        
    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines))
    print(f"Fixed {filepath}")

api_dir = "/Users/aj_builds/Documents/Programs/HireLoop/apps/api"
for root, _, files in os.walk(api_dir):
    for name in files:
        if name.endswith('.py') and "site-packages" not in root and "venv" not in root:
            fix_file(os.path.join(root, name))
