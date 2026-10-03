import sys

with open('frontend/src/layouts/DashboardLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
content = content.replace("const location = useLocation();", "const location = useLocation();\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);")

# Overlay and Sidebar class
overlay_str = '''
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={ixed inset-y-0 left-0 z-50 w-[280px] bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 }>
'''
content = content.replace("      {/* Sidebar */}\n      <aside className=\"w-64 bg-gray-900 text-white flex flex-col\">", overlay_str)

# Sidebar Header with Close Button
header_str = '''        <div className="p-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-wider">TEXFLOW</h1>
            <p className="text-xs text-gray-400 mt-2">Garment / Textile Factory Management System</p>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>'''
content = content.replace('''        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider">TEXFLOW</h1>
          <p className="text-xs text-gray-400 mt-2">Garment / Textile Factory Management System</p>
        </div>''', header_str)

# Add onClick to all Links
content = content.replace("<Link to=", "<Link onClick={() => setIsSidebarOpen(false)} to=")

# Hamburger menu in Header
hamburger_str = '''        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center overflow-hidden">
            <button className="lg:hidden text-gray-700 mr-4 focus:outline-none" onClick={() => setIsSidebarOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 capitalize truncate whitespace-nowrap">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>'''
content = content.replace('''        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </h2>''', hamburger_str)

# Ensure header user section is responsive
content = content.replace('''<div className="flex items-center space-x-6">''', '''<div className="flex items-center space-x-2 sm:space-x-6 shrink-0">''')
content = content.replace('''<div className="flex items-center space-x-3 border-r border-gray-200 pr-6">''', '''<div className="flex items-center space-x-3 border-r border-gray-200 pr-2 sm:pr-6">''')
content = content.replace('''<div className="text-sm text-right border-r border-gray-200 pr-6">''', '''<div className="hidden sm:block text-sm text-right border-r border-gray-200 pr-6">''')
content = content.replace('''<span className="mr-3">Logout</span>''', '''<span className="hidden sm:inline mr-3">Logout</span>''')

# Remove the weird characters for icons on workers links and restore proper lucide icons (Wait, they used characters like dY"S earlier, let's just leave the link text alone since the prompt says DO NOT change icons, although they look mangled in the terminal output)

with open('frontend/src/layouts/DashboardLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
