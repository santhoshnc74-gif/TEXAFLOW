import os
import re

pages_dir = "frontend/src/pages"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Header structural changes
    content = content.replace('className="flex justify-between items-center mb-6"', 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6"')
    content = content.replace('className="text-3xl font-bold text-gray-800"', 'className="text-2xl sm:text-3xl font-bold text-gray-800"')
    
    # Dashboard has text-2xl
    content = content.replace('className="text-2xl font-bold text-gray-800"', 'className="text-xl sm:text-2xl font-bold text-gray-800"')
    
    # 2. Button groups in headers
    # e.g., <div className="flex gap-2"> or space-x-3
    content = re.sub(r'className="flex gap-2"', 'className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto"', content)
    content = re.sub(r'className="flex space-x-3"', 'className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto"', content)
    
    # Standalone + Add button that doesn't have w-full sm:w-auto
    # We will just inject it for standard primary buttons
    content = re.sub(r'(<button\s+[^>]*className="[^"]*bg-blue-600[^"]*)(")', r'\1 w-full sm:w-auto\2', content)

    # 3. Form/Filter layouts
    # if it has flex flex-col md:flex-row, it's already stacked on mobile. But let's ensure inputs and selects are w-full.
    content = re.sub(r'(<select\s+[^>]*className="[^"]*border rounded px-3 py-2[^"]*)(")', r'\1 w-full sm:w-auto\2', content)

    # 4. Grids
    content = content.replace('grid-cols-2 md:grid-cols-4', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')
    content = content.replace('grid-cols-1 md:grid-cols-2', 'grid-cols-1 sm:grid-cols-2')
    content = content.replace('grid-cols-2 md:grid-cols-5', 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5')
    content = content.replace('grid grid-cols-2 gap-y-4', 'grid grid-cols-1 sm:grid-cols-2 gap-y-4')

    # 5. Tables min-width
    # ensure tables have min-w-max or min-w-full
    if '<table className="w-full' in content and 'min-w-max' not in content:
        content = content.replace('<table className="w-full text-left', '<table className="min-w-max w-full text-left')
        content = content.replace('<table className="w-full border', '<table className="min-w-max w-full border')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))

