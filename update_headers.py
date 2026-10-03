import os
import re

def update_header(filepath, title, subtitle):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find standard h1
    pattern = r'<h1 className="text-2xl sm:text-3xl font-bold text-slate-800">.*?</h1>'
    repl = f'<div className="flex flex-col"><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1><p className="text-sm text-slate-500 mt-1">{subtitle}</p></div>'
    
    content = re.sub(pattern, repl, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base = r'C:\Users\chandrasekar\Downloads\texaflow\texflow-antigravity\frontend\src\pages'
update_header(os.path.join(base, 'Workers.tsx'), 'Worker Management', 'Manage factory employees and shifts.')
update_header(os.path.join(base, 'Machines.tsx'), 'Machine Inventory', 'Track machine status and maintenance.')
update_header(os.path.join(base, 'Orders.tsx'), 'Order Pipeline', 'Monitor customer orders and deadlines.')
update_header(os.path.join(base, 'Customers.tsx'), 'Customers', 'Manage customer relationships.')
update_header(os.path.join(base, 'Production.tsx'), 'Production Tracking', 'Monitor live manufacturing batches.')
update_header(os.path.join(base, 'Attendance.tsx'), 'Attendance Log', 'Daily workforce presence records.')
update_header(os.path.join(base, 'Reports.tsx'), 'Analytics Reports', 'Generate and export factory insights.')
update_header(os.path.join(base, 'Analytics.tsx'), 'Factory Analytics', 'Visual data summaries and performance.')
