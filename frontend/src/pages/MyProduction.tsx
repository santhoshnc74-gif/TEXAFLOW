import { useEffect, useState } from 'react';
import api from '../services/api';

const MyProduction = () => {
  const [production, setProduction] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduction();
  }, []);

  const fetchProduction = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/worker/me/production');
      setProduction(res.data);
    } catch (error) {
      console.error('Failed to fetch production', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentAssignments = production.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled');
  const pastAssignments = production.filter(p => p.status === 'Completed' || p.status === 'Cancelled');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-gray-100 text-gray-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTable = (assignments: any[], title: string) => (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-[#062B4A] mb-4">{title}</h2>
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#F6F8FB]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prod Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No assignments found.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{assignment.production_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.order_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.stage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                      {assignment.progress_percentage > 0 && assignment.status !== 'Completed' && (
                         <div className="text-xs text-gray-400 mt-1">{assignment.progress_percentage}%</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        <span className="text-gray-400">Start:</span> {assignment.start_date || '-'}
                      </div>
                      <div className="text-xs mt-1">
                        <span className="text-gray-400">End:</span> {assignment.end_date || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#062B4A]">My Production Assignments</h1>
        <p className="text-gray-500 mt-1">Your current and past production assignments</p>
      </div>

      {renderTable(currentAssignments, 'Current Assignments')}
      {renderTable(pastAssignments, 'Past Assignments')}
      
    </div>
  );
};

export default MyProduction;
