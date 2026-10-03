import os
import re

def main():
    base_dir = r"C:\Users\chandrasekar\Downloads\texaflow\texflow-antigravity\frontend\src\pages"
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Badges
                content = re.sub(r'rounded text-xs font-semibold', r'rounded-full text-xs font-bold border', content)
                content = re.sub(r'bg-green-100 text-green-800', r'bg-green-50 text-green-700 border-green-200', content)
                content = re.sub(r'bg-yellow-100 text-yellow-800', r'bg-amber-50 text-amber-700 border-amber-200', content)
                content = re.sub(r'bg-orange-100 text-orange-800', r'bg-orange-50 text-orange-700 border-orange-200', content)
                content = re.sub(r'bg-red-100 text-red-800', r'bg-red-50 text-red-700 border-red-200', content)
                content = re.sub(r'bg-slate-100 text-slate-800', r'bg-slate-50 text-slate-700 border-slate-200', content)
                content = re.sub(r'bg-blue-100 text-blue-800', r'bg-blue-50 text-blue-700 border-blue-200', content)

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

if __name__ == '__main__':
    main()
