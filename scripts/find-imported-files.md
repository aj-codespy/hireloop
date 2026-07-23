#!/usr/bin/env python3

import os
import re
from pathlib import Path


def is_component_file(path: Path):
    return path.suffix in ('.tsx', '.ts', '.jsx', '.js') and not path.stem.startswith('.') and 'node_modules' not in str(path)


def read_lockfile(lock_path: Path, cwd: Path) -> set:
    try:
        content = lock_path.read_text()
    except Exception:
        return set()

    # Extract file patterns similar to what we did in the terminal (export let reused later)
    # We'll focus on looking for exact patterns that guarantee change
    references = set()

    # Look for """" or triple-single pattern for file paths (avoid false positives)
    triple_double = re.findall(r'"""([^"]+\.ts[^"]*|\./[^"]+\.ts[^"]*)"""', content)
    triple_single = re.findall(r"'''([^']+\.ts[^']*|\./[^']+\.ts[^']*)"''", content)
    # Look for module declares: export * from './something.ts'
    export_from = re.findall(r'export \* from ["\']([^"\']+\.ts[^"\']*)["\']', content)
    # Look for export { ... } from './something.ts'
    export_from2 = re.findall(r'export \{[^}]+\} from ["\']([^"\']+\.ts[^"\']*)["\']', content)

    all_paths = set(triple_double + triple_single + export_from + export_from2)

    # Filter and normalize against cwd
    for entry in all_paths:
        entry = entry.strip()
        if entry.startswith('./'):
            entry = entry[2:]

        # Skip non-TS entries
        if not entry.endswith('.ts') and not entry.endswith('.tsx'):
            continue

        # If path is absolute or has protocol, skip
        if '/' in entry and not entry.startswith('.'):
            if 'http' in entry or 'github' in entry:
                continue

        # Resolve against cwd (lock_path is typically at repo root)
        try:
            resolved = (cwd / entry).resolve()
            if lock_path.parent in resolved.parents or resolved == lock_path.parent:
                if resolved.is_file():
                    references.add(resolved)
        except Exception:
            pass

    return references


def scan_imports(file_path: Path, cwd: Path) -> set:
    imports = set()
    try:
        text = file_path.read_text()
    except Exception:
        return imports

    # Handle TypeScript, JSX, and JavaScript
    tsx_pattern = r'from\s+["\'`]([^"\'`]+?\.tsx)(["\'`][^"\'`]*?)?\s*;'
    ts_pattern = r'from\s+["\'`]([^"\'`]+?\.ts)(["\'`][^"\'`]*?)?\s*;'
    js_pattern = r'from\s+["\'`]([^"\'`]+?\.js)(["\'`][^"\'`]*?)?\s*;'

    # Collect TS/JS/TSX imports
    imports.update(re.findall(tsx_pattern, text))
    imports.update(re.findall(ts_pattern, text))
    imports.update(re.findall(js_pattern, text))

    # Handle dynamic imports (optional)
    # import("'./something.ts'")
    dynamic_tsx = re.findall(r"import\s*\(\s*['\"`](/[^'\"`]+?\.tsx)[^'\"`]*?['\"`]\s*\)", text)
    dynamic_ts = re.findall(r"import\s*\(\s*['\"`](/[^'\"`]+?\.ts)[^'\"`]*?['\"`]\s*\)", text)
    dynamic_js = re.findall(r"import\s*\(\s*['\"`](/[^'\"`]+?\.js)[^'\"`]*?['\"`]\s*\)", text)
    imports.update(dynamic_tsx)
    imports.update(dynamic_ts)
    imports.update(dynamic_js)

    # Resolve relative imports
    resolved = set()
    for imp in imports:
        # Handle ./ and ../
        if imp.startswith('./') or imp.startswith('../'):
            try:
                resolved_path = (file_path.parent / imp).resolve()
                if resolved_path.is_file():
                    resolved.add(resolved_path)
            except Exception:
                pass
        else:
            # Try to find in node_modules (we won't add this to the map unless needed)
            pass

    return resolved


def write_tasks(roots):
    lock_files = []
    for root in roots:
        root_path = Path(root)
        # Grab the exact file, not directory
        lock = root_path / 'package-lock.json'
        if lock.is_file():
            lock_files.append(lock)

    task = {
        'description': 'List all files that might need updates when package-lock.json changes',
        'steps': [
            'Read package-lock.json',
            'Extract all file import paths that are TS/JS/TSX files',
            'For each referenced file, scan its content for additional file imports',
            'Collect all unique file paths that are TS/JS/TSX files',
            'Filter out directories, node_modules, .git, build artifacts, etc.',
            'Output list of files that should be added to git to record lockfile changes'
        ],
        'commands': [
            'find . -type f -name "package-lock.json" | head -5',
            'head -c 10000 package-lock.json | grep -o "\\"([^\\"]*\\.ts[\\\"]*\\)"\\" | head -10',
            'grep "from \"\\.\\/" package-lock.json | head -10',
        ],
        'notes': [
            'This is a helper script to find files that should be tracked together with package-lock.json',
            'These files are typically source files that import from each other',
            'We focus on TypeScript/JavaScript source files (.ts, .tsx, .js, .jsx)',
            'We skip binary files, node_modules, and build artifacts'
        ]
    }

    from hermes_tools import write_file
    import json
    from hermes_tools import write_file

    # Write task file
    write_file(
        '.hermes/tasks/find-imported-files.md',
        f"""# Find files that import from package-lock.json

{task['description']}

## Steps:
{chr(10).join(f'{i+1}. {s}' for i, s in enumerate(task['steps']))}

## Commands:
{chr(10).join(f'```bash\n{cmd}\n```' for cmd in task['commands'])}

## Notes:
{chr(10).join(f'• {note}' for note in task['notes'])}

## Implementation:
```python
{generate_task_code(roots)}
```"""
    )


def generate_task_code(roots):
    return '''#!/usr/bin/env python3

import os
import re
from pathlib import Path

def is_component_file(path: Path):
    return path.suffix in ('.tsx', '.ts', '.jsx', '.js') and \
        not path.stem.startswith('.') and 'node_modules' not in str(path)

def read_lockfile(lock_path: Path, cwd: Path) -> set:
    try:
        content = lock_path.read_text()
    except Exception:
        return set()

    references = set()

    # Look for import patterns inside lockfile (though lockfile shouldn't contain imports)
    # But we can extract from metadata if any
    # We will instead collect from the root package.json scripts

    return references

# This is a placeholder task that identifies files impacted by package-lock.json changes
print("This task is a template. It should be customized based on your project structure.")
print("Typically, files that import from each other should be tracked with package-lock.json.")
print("Check for package.json dependencies and their source files.")

# If you need to list the files that might be affected by lockfile changes, you can:
# 1. Find all .ts/.tsx/.js files in the source tree
# 2. Filter out node_modules, .git, build artifacts
# 3. Output to a file

import subprocess
source_extensions = ('.ts', '.tsx', '.js', '.jsx')
exclude_dirs = ('node_modules', '.git', '.next', 'dist', 'build', '__pycache__')
output_file = 'lockfile_impacted_files.txt'
with open(output_file, 'w') as f:
    for root, dirs, files in os.walk('.'):
        # Exclude directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in exclude_dirs]
        for file in files:
            if file.endswith(source_extensions):
                file_path = os.path.join(root, file)
                f.write(file_path + '\n')

print(f"Generated {output_file} with source files that may be affected.")
'''


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        roots = sys.argv[1:]
    else:
        # Look for apps/web and apps/api directories (based on project structure)
        roots = ['apps/web', 'apps/api']

    write_tasks(roots)
    print("Task generated.")
