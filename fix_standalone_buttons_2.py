import os

pages = ['Production.tsx', 'Orders.tsx', 'Customers.tsx', 'Machines.tsx', 'UserAccounts.tsx']
pages_dir = 'frontend/src/pages'

for p in pages:
    path = os.path.join(pages_dir, p)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We know exactly how it looks
        content = content.replace('className="bg-blue-600 hover:bg-blue-700 text-white \\nfont-semibold py-2 px-4 rounded shadow transition"', 'className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto"')
        content = content.replace('className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"', 'className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto"')
        
        # Remove duplicates
        content = content.replace('w-full sm:w-auto w-full sm:w-auto', 'w-full sm:w-auto')
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
