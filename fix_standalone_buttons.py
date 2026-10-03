import os
import re

pages = ['Production.tsx', 'Orders.tsx', 'Customers.tsx', 'Machines.tsx', 'UserAccounts.tsx']
pages_dir = 'frontend/src/pages'

for p in pages:
    path = os.path.join(pages_dir, p)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add w-full sm:w-auto to standalone Add buttons
        # e.g., className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
        content = re.sub(r'(<button[^>]*className="[^"]*bg-blue-600[^"]*)(")', r'\1 w-full sm:w-auto\2', content)
        content = re.sub(r'(<button[^>]*className="[^"]*bg-indigo-600[^"]*)(")', r'\1 w-full sm:w-auto\2', content)
        
        # Remove duplicates if any
        content = content.replace('w-full sm:w-auto w-full sm:w-auto', 'w-full sm:w-auto')
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
