import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import Machines from './pages/Machines';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import ProductionPage from './pages/Production';
import AIPredictions from './pages/AIPredictions';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Placeholder from './pages/Placeholder';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import WorkerDashboard from './pages/WorkerDashboard';
import MyAttendance from './pages/MyAttendance';
import WorkerProfile from './pages/WorkerProfile';
import MyProduction from './pages/MyProduction';
import UserAccounts from './pages/UserAccounts';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<DashboardLayout />}>
          
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="workers" element={<Workers />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="machines" element={<Machines />} />
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="ai-predictions" element={<AIPredictions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin/users" element={<UserAccounts />} />
            <Route path="settings" element={<Placeholder />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
            <Route path="worker-dashboard" element={<WorkerDashboard />} />
            <Route path="worker-profile" element={<WorkerProfile />} />
            <Route path="my-attendance" element={<MyAttendance />} />
            <Route path="my-production" element={<MyProduction />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="change-password" element={<ChangePassword />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
