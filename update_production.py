import os

filepath = r'C:\Users\chandrasekar\Downloads\texaflow\texflow-antigravity\frontend\src\pages\Production.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<div className="bg-blue-600 h-2 rounded-full"',
                          '<div className={h-2 rounded-full }')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
