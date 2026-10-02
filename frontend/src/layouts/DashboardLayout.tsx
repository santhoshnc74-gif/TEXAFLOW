import { Link, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { FiLogOut } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DashboardLayout() {
  const role = authService.getUserRole();
  const user = authService.getCurrentUser();
  const location = useLocation();
  
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
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider">TEXFLOW</h1>
          <p className="text-xs text-gray-400 mt-2">Garment / Textile Factory Management System</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {role === 'ADMIN' && (
            <>
              <Link to="/dashboard" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/dashboard')}`}>Dashboard</Link>
              <Link to="/workers" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/workers')}`}>Workers</Link>
              <Link to="/attendance" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/attendance')}`}>Attendance</Link>
              <Link to="/machines" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/machines')}`}>Machines</Link>
              <Link to="/customers" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/customers')}`}>Customers</Link>
              <Link to="/orders" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/orders')}`}>Orders</Link>
              <Link to="/production" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/production')}`}>Production</Link>
              <Link to="/ai-predictions" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/ai-predictions')}`}>AI Predictions</Link>
              <Link to="/analytics" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/analytics')}`}>Analytics</Link>
              <Link to="/reports" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/reports')}`}>Reports</Link>
              <Link to="/admin/users" className={`block py-2 px-4 rounded hover:bg-gray-800 transition ${isActive('/admin/users')}`}>User Accounts</Link>
            </>
          )}

          {role === 'WORKER' && (
            <>
              <Link to="/worker-dashboard" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/worker-dashboard') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">🏠</span> My Dashboard
              </Link>
              <Link to="/worker-profile" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/worker-profile') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">👤</span> My Profile
              </Link>
              <Link to="/my-attendance" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/my-attendance') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">📅</span> My Attendance
              </Link>
              <Link to="/my-production" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/my-production') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">📊</span> My Production
              </Link>
              <Link to="/change-password" className={`flex items-center py-2.5 px-4 rounded transition-colors ${isActive('/change-password') ? 'bg-[#1687F8] text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <span className="mr-3">🔒</span> Change Password
              </Link>
            </>
          )}

        </nav>
        
        {role === 'ADMIN' && (
          <div className="p-4 bg-gray-800">
             <Link to="/change-password" className="block py-2 px-4 rounded text-sm hover:bg-gray-700 transition">Change Password</Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-6">
            
            {role === 'WORKER' && workerProfile ? (
              <div className="flex items-center space-x-3 border-r border-gray-200 pr-6">
                <div className="h-10 w-10 rounded-full bg-[#1687F8] text-white flex items-center justify-center font-bold text-sm">
                  {workerProfile.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-sm text-right">
                  <p className="font-bold text-[#062B4A]">{workerProfile.name}</p>
                  <p className="text-gray-500 text-xs font-medium">{workerProfile.employee_id} | {workerProfile.department}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-right border-r border-gray-200 pr-6">
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
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
