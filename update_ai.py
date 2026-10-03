import os
import re

file_path = r'C:\Users\chandrasekar\Downloads\texaflow\texflow-antigravity\frontend\src\pages\AIPredictions.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add React Icons
if "import { FiBox, FiCpu, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';" not in content:
    content = content.replace("import ImportHistoricalDataModal from '../components/ImportHistoricalDataModal';",
                              "import ImportHistoricalDataModal from '../components/ImportHistoricalDataModal';\nimport { FiBox, FiCpu, FiAlertTriangle, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';")

# Hero Banner Update
content = content.replace('<h1 className="text-2xl sm:text-3xl font-bold text-slate-800">AI Predictions</h1>',
                          '<div className="flex flex-col"><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center"><FiCpu className="text-purple-600 mr-3" /> AI Predictions Engine</h1><p className="text-sm text-slate-500 mt-1">Smart predictive analysis for factory production scheduling.</p></div>')

# Change blue button for prediction to purple gradient
content = content.replace("className={w-full sm:w-auto px-6 py-2 rounded text-white font-bold transition }",
                          "className={w-full sm:w-auto px-6 py-2 rounded-lg text-white font-semibold shadow-sm transition-all duration-200 }")

# Change Model Status badges and cards
content = content.replace('bg-blue-50 border border-blue-200', 'bg-purple-50 border border-purple-200 shadow-sm')
content = content.replace('text-blue-900', 'text-purple-900')
content = content.replace('text-blue-800', 'text-purple-800')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
