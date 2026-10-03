import os
import re

file_path = r'C:\Users\chandrasekar\Downloads\texaflow\texflow-antigravity\frontend\src\pages\Dashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add React Icons
if "import { FiUsers, FiSettings, FiShoppingCart, FiActivity, FiArrowRight } from 'react-icons/fi';" not in content:
    content = content.replace("import { getDashboardSummary } from '../services/dashboardService';",
                              "import { getDashboardSummary } from '../services/dashboardService';\nimport { FiUsers, FiSettings, FiShoppingCart, FiActivity, FiArrowRight } from 'react-icons/fi';")

# Hero Banner Update
content = content.replace('<h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manager Dashboard</h1>',
                          '<div className="flex flex-col"><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Factory Dashboard</h1><p className="text-sm text-slate-500 mt-1">Good Morning! Here is what is happening in the factory today.</p></div>')

# Update Stat Cards to include icons and soft gradients
content = content.replace('className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200 border-t-4 border-blue-500"',
                          'className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group"')
content = content.replace('<h3 className="text-sm font-semibold text-slate-600 mb-1">Total Workers</h3>',
                          '<div className="flex justify-between items-start mb-4"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><FiUsers className="w-5 h-5"/></div><h3 className="text-sm font-semibold text-slate-500 mt-1">Total Workers</h3></div>')

content = content.replace('className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200 border-t-4 border-orange-500"',
                          'className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group"')
content = content.replace('<h3 className="text-sm font-semibold text-slate-600 mb-1">Machines Running</h3>',
                          '<div className="flex justify-between items-start mb-4"><div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><FiSettings className="w-5 h-5"/></div><h3 className="text-sm font-semibold text-slate-500 mt-1">Machines Running</h3></div>')

content = content.replace('className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200 border-t-4 border-purple-500"',
                          'className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group"')
content = content.replace('<h3 className="text-sm font-semibold text-slate-600 mb-1">Active Orders</h3>',
                          '<div className="flex justify-between items-start mb-4"><div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform"><FiShoppingCart className="w-5 h-5"/></div><h3 className="text-sm font-semibold text-slate-500 mt-1">Active Orders</h3></div>')

content = content.replace('className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200 border-t-4 border-green-500"',
                          'className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group"')
content = content.replace('<h3 className="text-sm font-semibold text-slate-600 mb-1">Active Production</h3>',
                          '<div className="flex justify-between items-start mb-4"><div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"><FiActivity className="w-5 h-5"/></div><h3 className="text-sm font-semibold text-slate-500 mt-1">Active Production</h3></div>')

content = content.replace('View Analytics &rarr;', 'View Analytics <FiArrowRight className="inline ml-1" />')
content = content.replace('Generate Reports &rarr;', 'Generate Reports <FiArrowRight className="inline ml-1" />')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
