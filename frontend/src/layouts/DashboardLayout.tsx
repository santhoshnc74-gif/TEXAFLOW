import { Link, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { FiLogOut } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DashboardLayout() {
  const role = authService.getUserRole();
  const user = authService.getCurrentUser();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [workerProfile, setWorkerProfile] = useState<any>(null);

  useEffect(() => {
    if (role === 'WORKER') {
      api.get('/api/worker/me/profile').then(res => {
        setWorkerProfile(res.data);
      }).catch(err => console.error(err));
    }
  }, [role]);

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path: string) => location.pathname === path ? 'bg-gray-800' : '';

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-wider">TEXFLOW</h1>
            <p className="text-xs text-gray-400 mt-2">Garment / Textile Factory Management System</p>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {role === 'ADMIN' && (
            <>
              <Link onClick={() => setIsSidebarOpen(false)} to="/dashboard" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/dashboard')}`}>Dashboard</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/workers" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/workers')}`}>Workers</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/attendance" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/attendance')}`}>Attendance</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/machines" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/machines')}`}>Machines</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/customers" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/customers')}`}>Customers</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/orders" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/orders')}`}>Orders</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/production" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/production')}`}>Production</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/ai-predictions" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/ai-predictions')}`}>AI Predictions</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/analytics" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/analytics')}`}>Analytics</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/reports" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/reports')}`}>Reports</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/admin/users" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/admin/users')}`}>User Accounts</Link>
            </>
          )}

          {role === 'WORKER' && (
            <>
              <Link onClick={() => setIsSidebarOpen(false)} to="/worker-dashboard" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/worker-dashboard') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">🏠</span> My Dashboard
              </Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/worker-profile" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/worker-profile') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">👤</span> My Profile
              </Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/my-attendance" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/my-attendance') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">📅</span> My Attendance
              </Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/my-production" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/my-production') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">📊</span> My Production
              </Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/change-password" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/change-password') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">🔒</span> Change Password
              </Link>
            </>
          )}

        </nav>
        
        {role === 'ADMIN' && (
          <div className="p-4 bg-gray-800">
             <Link onClick={() => setIsSidebarOpen(false)} to="/change-password" className="block py-2 px-4 rounded text-sm hover:bg-gray-700 transition">Change Password</Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center overflow-hidden">
            <button className="lg:hidden text-gray-700 mr-4 focus:outline-none" onClick={() => setIsSidebarOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 capitalize truncate whitespace-nowrap">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-6 shrink-0">
            
            {role === 'WORKER' && workerProfile ? (
              <div className="flex items-center space-x-3 border-r border-gray-200 pr-2 sm:pr-6">
                <div className="h-10 w-10 rounded-full bg-[#1687F8] text-white flex items-center justify-center font-bold text-sm">
                  {workerProfile.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-sm text-right">
                  <p className="font-bold text-[#062B4A]">{workerProfile.name}</p>
                  <p className="text-gray-500 text-xs font-medium">{workerProfile.employee_id} | {workerProfile.department}</p>
                </div>
              </div>
            ) : (
              <div className="hidden sm:block text-sm text-right border-r border-gray-200 pr-6">
                <p className="font-semibold text-gray-900">{user?.username}</p>
                <p className="text-gray-500 text-xs uppercase">{user?.role}</p>
              </div>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-red-600 transition font-medium text-sm"
              title="Logout"
            >
              <FiLogOut className="h-5 w-5 mr-1.5" /> Logout
            </button>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}



