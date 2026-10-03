import { useState, useEffect } from 'react';
import { getMachines, createMachine, updateMachine, deleteMachine, updateMachineStatus, getMachineHistory } from '../services/machineService';
import type { Machine, MachineStatusHistory } from '../services/machineService';
import { getWorkers } from '../services/workerService';
import type { Worker } from '../services/workerService';

export default function Machines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCondition, setFilterCondition] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [viewingMachine, setViewingMachine] = useState<Machine | null>(null);
  const [machineHistory, setMachineHistory] = useState<MachineStatusHistory[]>([]);

  const [formData, setFormData] = useState<Partial<Machine>>({
    machine_code: '', machine_name: '', machine_type: '', department: '',
    brand: '', model: '', installation_date: '', status: 'Available',
    condition: 'Good', current_operator_id: 0, last_maintenance_date: '',
    next_maintenance_date: '', notes: ''
  });

  const [statusFormData, setStatusFormData] = useState({
    status: 'Running',
    reason: '',
    downtime_minutes: 0,
    notes: ''
  });
  const [statusMachineId, setStatusMachineId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mems, wrks] = await Promise.all([
        getMachines(searchQuery || undefined, undefined, filterDepartment || undefined, filterStatus || undefined, filterCondition || undefined),
        getWorkers()
      ]);
      setMachines(mems);
      setWorkers(wrks);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load machines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, filterDepartment, filterStatus, filterCondition]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleStatusInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setStatusFormData({ ...statusFormData, [e.target.name]: value });
  };

  const openAddModal = () => {
    setEditingMachine(null);
    setFormData({
      machine_code: '', machine_name: '', machine_type: '', department: '',
      brand: '', model: '', installation_date: '', status: 'Available',
      condition: 'Good', current_operator_id: 0, last_maintenance_date: '',
      next_maintenance_date: '', notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      machine_code: machine.machine_code,
      machine_name: machine.machine_name,
      machine_type: machine.machine_type,
      department: machine.department,
      brand: machine.brand || '',
      model: machine.model || '',
      installation_date: machine.installation_date || '',
      status: machine.status,
      condition: machine.condition,
      current_operator_id: machine.current_operator_id || 0,
      last_maintenance_date: machine.last_maintenance_date || '',
      next_maintenance_date: machine.next_maintenance_date || '',
      notes: machine.notes || ''
    });
    setIsModalOpen(true);
  };

  const openStatusModal = (machine: Machine) => {
    setStatusMachineId(machine.id!);
    setStatusFormData({
      status: machine.status,
      reason: '',
      downtime_minutes: 0,
      notes: ''
    });
    setIsStatusModalOpen(true);
  };

  const openViewModal = async (machine: Machine) => {
    setViewingMachine(machine);
    setIsViewModalOpen(true);
    setMachineHistory([]); // reset
    try {
      const history = await getMachineHistory(machine.id!);
      setMachineHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this machine?")) {
      try {
        await deleteMachine(id);
        showMessage("Machine deleted successfully");
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete machine');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // transform current_operator_id = 0 to null
      const submitData = { ...formData };
      if (submitData.current_operator_id === 0 || submitData.current_operator_id === '0' as any) {
        submitData.current_operator_id = null as any;
      }

      if (editingMachine && editingMachine.id) {
        await updateMachine(editingMachine.id, submitData);
        showMessage("Machine updated successfully");
      } else {
        await createMachine(submitData as Machine);
        showMessage("Machine added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving machine');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusMachineId) return;
    try {
      await updateMachineStatus(statusMachineId, statusFormData);
      showMessage("Machine status updated successfully");
      setIsStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Running') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Running</span>;
    if (status === 'Idle') return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Idle</span>;
    if (status === 'Maintenance') return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">Maintenance</span>;
    if (status === 'Breakdown') return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Breakdown</span>;
    if (status === 'Available') return <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-semibold">Available</span>;
    if (status === 'Offline') return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">Offline</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{status}</span>;
  };

  const getConditionBadge = (condition: string) => {
    if (condition === 'Excellent') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Excellent</span>;
    if (condition === 'Good') return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Good</span>;
    if (condition === 'Needs Service') return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">Needs Service</span>;
    if (condition === 'Critical') return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Critical</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{condition}</span>;
  };

  // Stats
  const running = machines.filter(m => m.status === 'Running').length;
  const idle = machines.filter(m => m.status === 'Idle').length;
  const maintenance = machines.filter(m => m.status === 'Maintenance').length;
  const breakdown = machines.filter(m => m.status === 'Breakdown').length;
  const offline = machines.filter(m => m.status === 'Offline').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Machine Management</h1>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto"
        >
          + Add Machine
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

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-gray-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Total</h2>
          <div className="text-2xl font-bold">{machines.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-green-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Running</h2>
          <div className="text-2xl font-bold">{running}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-blue-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Idle</h2>
          <div className="text-2xl font-bold">{idle}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-orange-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Maintenance</h2>
          <div className="text-2xl font-bold">{maintenance}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-red-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Breakdown</h2>
          <div className="text-2xl font-bold">{breakdown}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-gray-300">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Offline</h2>
          <div className="text-2xl font-bold">{offline}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <input 
            type="text" 
            placeholder="Search Machine Code, Name, Brand..." 
            className="flex-1 border rounded px-3 py-2 min-w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
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
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Running">Running</option>
            <option value="Idle">Idle</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Breakdown">Breakdown</option>
            <option value="Offline">Offline</option>
          </select>
          <select 
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
          >
            <option value="">All Conditions</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Needs Service">Needs Service</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Code</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Name / Type</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Department</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Operator</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Condition</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Next Maint.</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading machines...
                  </td>
                </tr>
              ) : machines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No machines found.
                  </td>
                </tr>
              ) : (
                machines.map(machine => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = machine.next_maintenance_date && machine.next_maintenance_date < today;
                  return (
                    <tr key={machine.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{machine.machine_code}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold">{machine.machine_name}</div>
                        <div className="text-gray-500 text-xs">{machine.machine_type}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{machine.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{machine.operator_name || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(machine.status)}</td>
                      <td className="px-4 py-3 text-sm">{getConditionBadge(machine.condition)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}>
                          {machine.next_maintenance_date || '-'}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openViewModal(machine)} className="text-blue-600 hover:text-blue-800" title="View">View</button>
                          <button onClick={() => openEditModal(machine)} className="text-gray-600 hover:text-gray-800" title="Edit">Edit</button>
                          <button onClick={() => openStatusModal(machine)} className="text-green-600 hover:text-green-800" title="Status">Status</button>
                          <button onClick={() => handleDelete(machine.id!)} className="text-red-600 hover:text-red-800" title="Delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">{editingMachine ? 'Edit Machine' : 'Add New Machine'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine Code *</label>
                  <input required name="machine_code" type="text" value={formData.machine_code} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine Name *</label>
                  <input required name="machine_name" type="text" value={formData.machine_name} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine Type *</label>
                  <input required name="machine_type" type="text" placeholder="e.g. Sewing Machine" value={formData.machine_type} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select required name="department" value={formData.department} onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input name="brand" type="text" value={formData.brand || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input name="model" type="text" value={formData.model || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
                  <input name="installation_date" type="date" value={formData.installation_date || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="Available">Available</option>
                    <option value="Running">Running</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select name="condition" value={formData.condition} onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Service">Needs Service</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Operator</label>
                  <select name="current_operator_id" value={formData.current_operator_id || 0} onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value={0}>No Operator Assigned</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.employee_id} - {w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance Date</label>
                  <input name="last_maintenance_date" type="date" value={formData.last_maintenance_date || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance Date</label>
                  <input name="next_maintenance_date" type="date" value={formData.next_maintenance_date || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" rows={2}></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto">
                  {editingMachine ? 'Update Machine' : 'Save Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pt-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Update Status</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            <form onSubmit={handleStatusSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Status *</label>
                  <select required name="status" value={statusFormData.status} onChange={handleStatusInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="Available">Available</option>
                    <option value="Running">Running</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input name="reason" type="text" value={statusFormData.reason} onChange={handleStatusInputChange} className="w-full border rounded px-3 py-2" placeholder="e.g. Broken needle, Maintenance" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Downtime (Minutes)</label>
                  <input name="downtime_minutes" type="number" min="0" value={statusFormData.downtime_minutes} onChange={handleStatusInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea name="notes" value={statusFormData.notes} onChange={handleStatusInputChange} className="w-full border rounded px-3 py-2" rows={2}></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Machine Details: {viewingMachine.machine_code}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Details Column */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Information</h3>
                <div className="grid grid-cols-2 gap-y-3">
                  <div className="text-gray-500 text-sm">Machine Name</div>
                  <div className="font-medium">{viewingMachine.machine_name}</div>
                  
                  <div className="text-gray-500 text-sm">Machine Type</div>
                  <div className="font-medium">{viewingMachine.machine_type}</div>
                  
                  <div className="text-gray-500 text-sm">Department</div>
                  <div className="font-medium">{viewingMachine.department}</div>
                  
                  <div className="text-gray-500 text-sm">Brand & Model</div>
                  <div className="font-medium">{viewingMachine.brand || '-'} {viewingMachine.model || ''}</div>
                  
                  <div className="text-gray-500 text-sm">Operator</div>
                  <div className="font-medium">{viewingMachine.operator_name || 'Unassigned'}</div>
                  
                  <div className="text-gray-500 text-sm">Installation Date</div>
                  <div className="font-medium">{viewingMachine.installation_date || '-'}</div>
                  
                  <div className="text-gray-500 text-sm">Current Status</div>
                  <div>{getStatusBadge(viewingMachine.status)}</div>

                  <div className="text-gray-500 text-sm">Condition</div>
                  <div>{getConditionBadge(viewingMachine.condition)}</div>
                  
                  <div className="text-gray-500 text-sm">Last Maintenance</div>
                  <div className="font-medium">{viewingMachine.last_maintenance_date || '-'}</div>

                  <div className="text-gray-500 text-sm">Next Maintenance</div>
                  <div className="font-medium">{viewingMachine.next_maintenance_date || '-'}</div>
                  
                  <div className="text-gray-500 text-sm col-span-2 mt-2">Notes</div>
                  <div className="font-medium col-span-2 bg-gray-50 p-3 rounded text-sm">{viewingMachine.notes || '-'}</div>
                </div>
              </div>

              {/* History Column */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Status History</h3>
                {machineHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No history records found.</p>
                ) : (
                  <div className="overflow-y-auto max-h-[400px] pr-2">
                    <div className="space-y-4">
                      {machineHistory.map(hist => (
                        <div key={hist.id} className="border border-gray-200 rounded p-3 bg-gray-50 text-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-700">{new Date(hist.changed_at).toLocaleString()}</span>
                            <div className="flex items-center gap-2">
                              {hist.previous_status ? (
                                <>
                                  <span className="text-gray-500">{hist.previous_status}</span>
                                  <span className="text-gray-400">→</span>
                                </>
                              ) : null}
                              {getStatusBadge(hist.new_status)}
                            </div>
                          </div>
                          {hist.reason && <div className="mb-1"><span className="text-gray-500">Reason:</span> {hist.reason}</div>}
                          {hist.downtime_minutes > 0 && <div className="mb-1"><span className="text-gray-500">Downtime:</span> {hist.downtime_minutes} min</div>}
                          {hist.notes && <div className="text-gray-600 mt-2 bg-white p-2 border rounded">{hist.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
