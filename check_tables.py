import os

pages_dir = r"frontend/src/pages"
for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                if "<table" in content and "overflow-x-auto" not in content:
                    print(f"Missing overflow-x-auto in: {path}")
