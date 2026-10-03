import os

pages_dir = 'frontend/src/pages'

for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'w-full max-w-' in content and 'mx-4' not in content:
                # Add mx-4 to ensure modal margins
                content = content.replace('className="bg-white rounded-lg shadow-xl w-full max-w-lg"', 'className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"')
                content = content.replace('className="bg-white rounded-lg shadow-xl w-full max-w-md"', 'className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"')
                content = content.replace('className="bg-white rounded-lg shadow-xl w-full max-w-2xl"', 'className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"')
                content = content.replace('className="bg-white rounded-lg shadow-xl w-full max-w-3xl"', 'className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4"')
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Patched modal in {file}")

