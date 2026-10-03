import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { authService } from '../services/authService';

export default function DashboardLayout() {
  const location = useLocation();
  const user = authService.getCurrentUser();
  const role = user?.role;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workerProfile, setWorkerProfile] = useState<any>(null);

  useEffect(() => {
    if (role === 'WORKER' && user?.worker_id) {
      import('../services/workerService').then(module => {
        return module.getMyProfile();
      }).then(res => {
        setWorkerProfile(res);
      }).catch(err => {
        console.error(err);
        setWorkerProfile({ name: user.username, employee_id: 'N/A', department: 'Unknown' });
      });
    } else if (role === 'WORKER') {
      setWorkerProfile({ name: user.username, employee_id: 'N/A', department: 'Unknown' });
    }
  }, [role, user]);

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path: string) => location.pathname === path ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white';

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900 bg-opacity-50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-start border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white flex items-center">
              <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">T</span>
              TEXFLOW
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">Smart Textile Factory System</p>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {role === 'ADMIN' && (
            <>
              <Link onClick={() => setIsSidebarOpen(false)} to="/dashboard" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/dashboard')}`}>Dashboard</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/workers" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/workers')}`}>Workers</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/attendance" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/attendance')}`}>Attendance</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/machines" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/machines')}`}>Machines</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/customers" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/customers')}`}>Customers</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/orders" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/orders')}`}>Orders</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/production" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/production')}`}>Production</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/ai-predictions" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${location.pathname === '/ai-predictions' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20' : 'text-slate-300 hover:bg-slate-800 hover:text-purple-300'}`}>AI Predictions</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/analytics" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/analytics')}`}>Analytics</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/reports" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/reports')}`}>Reports</Link>
              
              <div className="pt-4 mt-4 border-t border-slate-800">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System</p>
                <Link onClick={() => setIsSidebarOpen(false)} to="/admin/users" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/admin/users')}`}>User Accounts</Link>
              </div>
            </>
          )}

          {role === 'WORKER' && (
            <>
              <Link onClick={() => setIsSidebarOpen(false)} to="/worker-dashboard" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/worker-dashboard')}`}>My Dashboard</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/worker-profile" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/worker-profile')}`}>My Profile</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/my-attendance" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/my-attendance')}`}>My Attendance</Link>
              <Link onClick={() => setIsSidebarOpen(false)} to="/my-production" className={`block py-2.5 px-4 rounded-xl transition-all duration-200 font-medium ${isActive('/my-production')}`}>My Production</Link>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <Link onClick={() => setIsSidebarOpen(false)} to="/change-password" className="block py-2.5 px-4 rounded-xl text-sm hover:bg-slate-800 transition-colors duration-200 font-medium text-slate-400 hover:text-white">Change Password</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-8 z-10 border-b border-slate-200">
          <div className="flex items-center overflow-hidden">
            <button className="lg:hidden text-slate-600 mr-4 focus:outline-none hover:bg-slate-100 p-2 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(true)}>
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-64 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <FiSearch className="w-4 h-4 mr-2" />
              <input type="text" placeholder="Search dashboard..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400" disabled />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-6 shrink-0">
            
            {role === 'WORKER' && workerProfile ? (
              <div className="flex items-center space-x-3 border-r border-slate-200 pr-2 sm:pr-6">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {workerProfile.name ? workerProfile.name.substring(0, 2).toUpperCase() : 'W'}
                </div>
                <div className="text-sm text-right hidden sm:block">
                  <p className="font-bold text-slate-800">{workerProfile.name || user?.username || 'Worker'}</p>
                  <p className="text-slate-500 text-xs font-medium">{workerProfile.employee_id || 'N/A'} | {workerProfile.department || 'Worker'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-r border-slate-200 pr-4 sm:pr-6">
                <div className="hidden sm:block text-sm text-right">
                  <p className="font-bold text-slate-800">{user?.username || 'Admin'}</p>
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">{user?.role || 'ADMIN'}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-slate-200">
                  A
                </div>
              </div>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center text-slate-500 hover:text-red-600 transition-colors font-semibold text-sm px-2 py-1 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <FiLogOut className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

