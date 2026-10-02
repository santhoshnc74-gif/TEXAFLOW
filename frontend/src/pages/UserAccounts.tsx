import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FiPower, FiRefreshCw } from 'react-icons/fi';

const UserAccounts = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Account State
  const [showForm, setShowForm] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(true);

  // Reset Password State
  const [showReset, setShowReset] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const accRes = await api.get('/api/admin/');
      const workRes = await api.get('/api/workers/');
      setAccounts(accRes.data);
      setWorkers(workRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/worker-accounts', {
        worker_id: parseInt(workerId),
        username,
        password,
        must_change_password: mustChange
      });
      alert('Account created successfully');
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating account');
    }
  };

  const handleReset = async (e: React.FormEvent, userId: number) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/${userId}/reset-password`, {
        new_password: resetPassword,
        must_change_password: true
      });
      alert('Password reset successfully');
      setShowReset(null);
      setResetPassword('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error resetting password');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.put(`/api/admin/${userId}/status?is_active=${!currentStatus}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error changing status');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading user accounts...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Accounts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Create Worker Login'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow p-6 rounded-lg mb-6">
          <h2 className="text-lg font-medium mb-4">Create Worker Login</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Worker</label>
                <select
                  required
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Select a worker...</option>
                  {workers.filter(w => !accounts.find(a => a.worker_id === w.id)).map(w => (
                    <option key={w.id} value={w.id}>{w.employee_id} - {w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={mustChange}
                  onChange={(e) => setMustChange(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Require password change on first login</label>
              </div>
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Save Account</button>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map(acc => (
              <tr key={acc.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{acc.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{acc.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {acc.worker_id ? workers.find(w => w.id === acc.worker_id)?.name : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${acc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {acc.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {acc.last_login ? new Date(acc.last_login).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3 flex items-center">
                  {acc.role !== 'ADMIN' && (
                    <>
                      <button onClick={() => setShowReset(showReset === acc.id ? null : acc.id)} className="text-indigo-600 hover:text-indigo-900" title="Reset Password">
                        <FiRefreshCw className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleToggleStatus(acc.id, acc.is_active)} className="text-gray-600 hover:text-gray-900" title={acc.is_active ? 'Disable' : 'Enable'}>
                        <FiPower className={`h-5 w-5 ${acc.is_active ? 'text-red-500' : 'text-green-500'}`} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showReset && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Reset Password</h3>
            <form onSubmit={(e) => handleReset(e, showReset)}>
              <input
                type="password"
                required
                placeholder="New Password"
                className="w-full border p-2 mb-4 rounded"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowReset(null)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccounts;
