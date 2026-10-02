import { useState, useEffect } from 'react';
import { getWorkers, searchWorkers, createWorker, updateWorker, deleteWorker } from '../services/workerService';
import type { Worker } from '../services/workerService';

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);
  
  const [formData, setFormData] = useState<Partial<Worker>>({
    employee_id: '',
    name: '',
    department: '',
    designation: '',
    phone: '',
    email: '',
    shift: '',
    joining_date: '',
    status: 'Active'
  });

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (searchQuery || departmentFilter || statusFilter) {
        const data = await searchWorkers(searchQuery, departmentFilter, statusFilter);
        setWorkers(data);
      } else {
        const data = await getWorkers();
        setWorkers(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch workers from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [searchQuery, departmentFilter, statusFilter]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingWorker(null);
    setFormData({
      employee_id: '', name: '', department: '', designation: '', 
      phone: '', email: '', shift: '', joining_date: '', status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      employee_id: worker.employee_id,
      name: worker.name,
      department: worker.department,
      designation: worker.designation || '',
      phone: worker.phone || '',
      email: worker.email || '',
      shift: worker.shift || '',
      joining_date: worker.joining_date || '',
      status: worker.status
    });
    setIsModalOpen(true);
  };

  const openViewModal = (worker: Worker) => {
    setViewingWorker(worker);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this worker?")) {
      try {
        await deleteWorker(id);
        showMessage("Worker deleted successfully");
        fetchWorkers();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete worker');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorker && editingWorker.id) {
        await updateWorker(editingWorker.id, formData);
        showMessage("Worker updated successfully");
      } else {
        await createWorker(formData as Worker);
        showMessage("Worker added successfully");
      }
      setIsModalOpen(false);
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'An error occurred while saving worker details');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Active</span>;
    if (status === 'Inactive') return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">Inactive</span>;
    if (status === 'On Leave') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">On Leave</span>;
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">{status}</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Worker Management</h1>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
        >
          + Add Worker
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 shadow-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search by Name or ID..." 
            className="flex-1 border rounded px-3 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="border rounded px-3 py-2"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="Cutting">Cutting</option>
            <option value="Stitching">Stitching</option>
            <option value="Finishing">Finishing</option>
            <option value="Quality">Quality</option>
            <option value="Packing">Packing</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Administration">Administration</option>
          </select>
          <select 
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Employee ID</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Department</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Designation</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Phone</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Shift</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Joining Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                       <span className="ml-2">Loading workers...</span>
                    </div>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No workers found
                  </td>
                </tr>
              ) : (
                workers.map(worker => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{worker.employee_id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{worker.name}</td>
                    <td className="px-4 py-3 text-sm">{worker.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{worker.designation || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{worker.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{worker.shift || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(worker.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{worker.joining_date || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openViewModal(worker)} className="text-blue-600 hover:text-blue-800" title="View">View</button>
                        <button onClick={() => openEditModal(worker)} className="text-gray-600 hover:text-gray-800" title="Edit">Edit</button>
                        <button onClick={() => handleDelete(worker.id!)} className="text-red-600 hover:text-red-800" title="Delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto pt-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">{editingWorker ? 'Edit Worker' : 'Add New Worker'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                  <input required name="employee_id" type="text" value={formData.employee_id} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required name="name" type="text" value={formData.name} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select required name="department" value={formData.department} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                    <option value="">Select Department</option>
                    <option value="Cutting">Cutting</option>
                    <option value="Stitching">Stitching</option>
                    <option value="Finishing">Finishing</option>
                    <option value="Quality">Quality</option>
                    <option value="Packing">Packing</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input name="designation" type="text" value={formData.designation} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="phone" type="text" value={formData.phone} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                    <option value="">Select Shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input name="joining_date" type="date" value={formData.joining_date} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingWorker ? 'Update Worker' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pt-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Worker Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-4">
                <div className="text-gray-500 text-sm">Employee ID</div>
                <div className="font-medium">{viewingWorker.employee_id}</div>
                
                <div className="text-gray-500 text-sm">Name</div>
                <div className="font-medium">{viewingWorker.name}</div>
                
                <div className="text-gray-500 text-sm">Department</div>
                <div className="font-medium">{viewingWorker.department}</div>
                
                <div className="text-gray-500 text-sm">Designation</div>
                <div className="font-medium">{viewingWorker.designation || '-'}</div>
                
                <div className="text-gray-500 text-sm">Phone</div>
                <div className="font-medium">{viewingWorker.phone || '-'}</div>
                
                <div className="text-gray-500 text-sm">Email</div>
                <div className="font-medium">{viewingWorker.email || '-'}</div>
                
                <div className="text-gray-500 text-sm">Shift</div>
                <div className="font-medium">{viewingWorker.shift || '-'}</div>
                
                <div className="text-gray-500 text-sm">Joining Date</div>
                <div className="font-medium">{viewingWorker.joining_date || '-'}</div>
                
                <div className="text-gray-500 text-sm">Status</div>
                <div>{getStatusBadge(viewingWorker.status)}</div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 border rounded bg-white text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
