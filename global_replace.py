import os
import re

def replace_in_file(filepath, pattern, repl):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = re.sub(pattern, repl, content)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    base_dir = r"C:\Users\chandrasekar\Downloads\texaflow\texflow-antigravity\frontend\src"
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Global design changes

                # General Buttons (blue-600)
                content = re.sub(r'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded([^a-zA-Z])', r'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-200\1', content)
                content = re.sub(r'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold shadow transition', r'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200', content)
                content = re.sub(r'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow', r'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-6 rounded-lg shadow-sm transition-all duration-200', content)
                
                # Green / Success Buttons
                content = re.sub(r'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold shadow transition', r'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200', content)
                content = re.sub(r'bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold shadow transition', r'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200', content)

                # Red / Danger Buttons
                content = re.sub(r'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold shadow transition', r'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200', content)
                content = re.sub(r'bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold shadow transition', r'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200', content)
                content = re.sub(r'bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm', r'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-1 px-3 rounded-lg text-sm shadow-sm transition-all duration-200', content)

                # Cards and Panels
                content = re.sub(r'bg-white rounded-lg shadow p-6', r'bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200', content)
                content = re.sub(r'bg-white rounded-lg shadow p-4', r'bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200', content)
                content = re.sub(r'bg-white rounded-lg shadow overflow-hidden', r'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden', content)
                content = re.sub(r'bg-white rounded-lg shadow flex flex-col flex-1', r'bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1', content)
                
                # Tables
                content = re.sub(r'thead className="bg-gray-100 border-b"', r'thead className="bg-slate-50 border-b border-slate-200"', content)
                content = re.sub(r'thead className="bg-gray-50 border-b"', r'thead className="bg-slate-50 border-b border-slate-200"', content)
                content = re.sub(r'hover:bg-gray-50', r'hover:bg-slate-50 transition-colors duration-150', content)
                content = re.sub(r'text-gray-500', r'text-slate-500', content)
                content = re.sub(r'text-gray-600', r'text-slate-600', content)
                content = re.sub(r'text-gray-700', r'text-slate-700', content)
                content = re.sub(r'text-gray-800', r'text-slate-800', content)
                content = re.sub(r'text-gray-900', r'text-slate-900', content)
                content = re.sub(r'border-gray-200', r'border-slate-200', content)
                content = re.sub(r'border-gray-300', r'border-slate-300', content)
                content = re.sub(r'bg-gray-50', r'bg-slate-50', content)
                content = re.sub(r'bg-gray-100', r'bg-slate-100', content)

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

if __name__ == '__main__':
    main()
