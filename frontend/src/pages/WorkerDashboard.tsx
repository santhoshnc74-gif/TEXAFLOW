import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/authService';
import { FiCheckCircle, FiXCircle, FiClock, FiSettings, FiActivity } from 'react-icons/fi';

const WorkerDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [production, setProduction] = useState<any[]>([]);
  const [machine, setMachine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        const [profileRes, attendanceRes, prodRes, machineRes] = await Promise.all([
          api.get('/api/worker/me/profile'),
          api.get('/api/worker/me/attendance'),
          api.get('/api/worker/me/production'),
          api.get('/api/worker/me/machine'),
        ]);
        setProfile(profileRes.data);
        setAttendance(attendanceRes.data);
        setProduction(prodRes.data);
        setMachine(machineRes.data);
      } catch (error) {
        console.error('Failed to fetch worker data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const todayAttendance = attendance.length > 0 ? attendance[0] : null;
  const currentProd = production.length > 0 ? production[0] : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {profile?.name || authService.getCurrentUser()?.username}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Today's Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <FiClock className="mr-2 h-5 w-5 text-indigo-500" /> Today's Attendance
          </div>
          {todayAttendance ? (
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                {todayAttendance.status === 'Present' ? (
                  <FiCheckCircle className="text-green-500 mr-2 h-6 w-6" />
                ) : (
                  <FiXCircle className="text-red-500 mr-2 h-6 w-6" />
                )}
                {todayAttendance.status}
              </div>
              <p className="text-sm text-gray-500">{new Date(todayAttendance.attendance_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          ) : (
            <div className="text-lg font-medium text-gray-700">No Record Yet</div>
          )}
        </div>

        {/* Card 2: My Department */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <FiSettings className="mr-2 h-5 w-5 text-blue-500" /> My Department
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{profile?.department || '-'}</div>
          <p className="text-sm text-gray-500">Production</p>
        </div>

        {/* Card 3: My Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <FiActivity className="mr-2 h-5 w-5 text-green-500" /> My Assignments
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{production.filter(p => p.status !== 'Completed').length}</div>
          <p className="text-sm text-gray-500">Active Production</p>
        </div>

        {/* Card 4: Assigned Machine */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <FiSettings className="mr-2 h-5 w-5 text-orange-500" /> Assigned Machine
          </div>
          {machine ? (
            <>
              <div className="text-2xl font-bold text-gray-900 mb-1">{machine.machine_code}</div>
              <p className="text-sm text-gray-500">{machine.machine_type}</p>
            </>
          ) : (
            <div className="text-lg font-medium text-gray-700">No Machine Assigned</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Production */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Current Production</h2>
            <Link to="/my-production" className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">View All &rarr;</Link>
          </div>
          
          {currentProd ? (
            <div>
              <div className="mb-4">
                <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">Production Code</span>
                <p className="text-lg font-medium text-gray-900">{currentProd.production_code}</p>
              </div>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">Product</span>
                  <p className="text-sm font-medium text-gray-900">{currentProd.product_name}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">Stage</span>
                  <p className="text-sm font-medium text-gray-900">{currentProd.stage}</p>
                </div>
              </div>
              
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-bold text-indigo-600">{currentProd.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${currentProd.progress_percentage}%` }}></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 border-t border-gray-100 pt-4">
                <div>
                  <span className="block text-xs text-gray-500">Target Quantity</span>
                  <span className="block text-sm font-medium">{currentProd.target_quantity}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Completed</span>
                  <span className="block text-sm font-medium text-green-600">{currentProd.completed_quantity}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Remaining</span>
                  <span className="block text-sm font-medium text-orange-600">{currentProd.remaining_quantity}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Planned End Date</span>
                  <span className="block text-sm font-medium">{currentProd.end_date || '-'}</span>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-12 text-gray-500">
               No production assignments found.
             </div>
          )}
        </div>

        {/* Machine Assignment */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Machine Assignment</h2>
            <Link to="/worker-profile" className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">View Details &rarr;</Link>
          </div>

          {machine ? (
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{machine.machine_code}</h3>
                  <p className="text-gray-500">{machine.machine_name || machine.machine_type}</p>
                </div>
                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  ● Running
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">Department</span>
                  <span className="text-sm font-medium text-gray-900">{machine.department || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">Assigned Since</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">Current Operator</span>
                  <span className="text-sm font-medium text-gray-900">{profile?.name || '-'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
               No machine currently assigned.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
