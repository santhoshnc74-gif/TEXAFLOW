import os
import re

def update_header(filepath, title, subtitle):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = r'<h1 className="text-2xl sm:text-3xl font-bold text-slate-800">.*?</h1>'
    repl = f'<div className="flex flex-col"><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1><p className="text-sm text-slate-500 mt-1">{subtitle}</p></div>'
    
    content = re.sub(pattern, repl, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base = r'C:\Users\chandrasekar\Downloads\texaflow\texflow-antigravity\frontend\src\pages'
update_header(os.path.join(base, 'WorkerDashboard.tsx'), 'My Dashboard', 'Overview of your assignments and schedule.')
update_header(os.path.join(base, 'MyAttendance.tsx'), 'My Attendance', 'Your check-ins and attendance history.')
update_header(os.path.join(base, 'MyProduction.tsx'), 'My Production', 'Your assigned manufacturing tasks.')
update_header(os.path.join(base, 'WorkerProfile.tsx'), 'My Profile', 'Your personal and employment details.')
