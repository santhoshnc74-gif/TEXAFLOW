import { useState, useEffect } from 'react';
import { getAttendance, createAttendance, updateAttendance, deleteAttendance, createBulkAttendance } from '../services/attendanceService';
import type { Attendance as AttendanceRecord } from '../services/attendanceService';
import { getWorkers } from '../services/workerService';
import type { Worker } from '../services/workerService';

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null);
  
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({
    worker_id: 0,
    attendance_date: today,
    status: 'Present',
    shift: '',
    check_in: '',
    check_out: '',
    overtime_hours: 0,
    remarks: ''
  });

  const [bulkData, setBulkData] = useState<Record<number, string>>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [attData, workerData] = await Promise.all([
        getAttendance(filterDate, filterWorker ? parseInt(filterWorker) : undefined, filterStatus || undefined),
        getWorkers()
      ]);
      
      let filteredRecords = attData;
      if (searchQuery) {
        filteredRecords = attData.filter((r: any) => 
          r.worker_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          r.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setRecords(filteredRecords);
      setWorkers(workerData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, filterWorker, filterStatus, searchQuery]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      worker_id: workers.length > 0 ? workers[0].id : 0,
      attendance_date: filterDate,
      status: 'Present',
      shift: '', check_in: '', check_out: '', overtime_hours: 0, remarks: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormData({
      worker_id: record.worker_id,
      attendance_date: record.attendance_date,
      status: record.status,
      shift: record.shift || '',
      check_in: record.check_in || '',
      check_out: record.check_out || '',
      overtime_hours: record.overtime_hours || 0,
      remarks: record.remarks || ''
    });
    setIsModalOpen(true);
  };

  const openBulkModal = () => {
    const initialBulk: Record<number, string> = {};
    workers.forEach(w => {
      // Find if already exists
      const existing = records.find(r => r.worker_id === w.id);
      initialBulk[w.id!] = existing ? existing.status : 'Present';
    });
    setBulkData(initialBulk);
    setIsBulkModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await deleteAttendance(id);
        showMessage("Attendance deleted successfully");
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete record');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord && editingRecord.id) {
        await updateAttendance(editingRecord.id, formData);
        showMessage("Attendance updated successfully");
      } else {
        await createAttendance(formData as AttendanceRecord);
        showMessage("Attendance recorded successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving attendance');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recordsToCreate = workers.map(w => ({
        worker_id: w.id!,
        attendance_date: filterDate,
        status: bulkData[w.id!]
      })).filter(r => {
        const existing = records.find(rec => rec.worker_id === r.worker_id);
        return !existing; // Only send new records
      });

      if (recordsToCreate.length === 0) {
        alert("All workers already have attendance marked for this date.");
        setIsBulkModalOpen(false);
        return;
      }

      await createBulkAttendance(recordsToCreate);
      showMessage("Bulk attendance recorded successfully");
      setIsBulkModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving bulk attendance');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Present') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Present</span>;
    if (status === 'Absent') return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Absent</span>;
    if (status === 'On Leave') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">On Leave</span>;
    if (status === 'Half Day') return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Half Day</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{status}</span>;
  };

  // Compute stats for current view
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const onLeaveCount = records.filter(r => r.status === 'On Leave').length;
  const halfDayCount = records.filter(r => r.status === 'Half Day').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Attendance Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={openBulkModal}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto"
          >
            Mark Daily Attendance
          </button>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto"
          >
            + Mark Attendance
          </button>
        </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-gray-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Total Workers</h2>
          <div className="text-2xl font-bold">{workers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-green-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Present</h2>
          <div className="text-2xl font-bold">{presentCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-red-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Absent</h2>
          <div className="text-2xl font-bold">{absentCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-yellow-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">On Leave</h2>
          <div className="text-2xl font-bold">{onLeaveCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-blue-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Half Day</h2>
          <div className="text-2xl font-bold">{halfDayCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <input 
            type="date"
            className="border rounded px-3 py-2"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Search Worker..." 
            className="flex-1 border rounded px-3 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filterWorker}
            onChange={(e) => setFilterWorker(e.target.value)}
          >
            <option value="">All Workers</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.employee_id} - {w.name}</option>
            ))}
          </select>
          <select 
            className="border rounded px-3 py-2 w-full sm:w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Employee ID</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Department</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Shift</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Check In</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Check Out</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Overtime</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Loading attendance data...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{record.employee_id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{record.worker_name}</td>
                    <td className="px-4 py-3 text-sm">{record.department}</td>
                    <td className="px-4 py-3 text-sm">{record.attendance_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.shift || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.check_in || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.check_out || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.overtime_hours ? `${record.overtime_hours}h` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setViewingRecord(record); setIsViewModalOpen(true); }} className="text-blue-600 hover:text-blue-800" title="View">View</button>
                        <button onClick={() => openEditModal(record)} className="text-gray-600 hover:text-gray-800" title="Edit">Edit</button>
                        <button onClick={() => handleDelete(record.id!)} className="text-red-600 hover:text-red-800" title="Delete">Delete</button>
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
              <h2 className="text-xl font-bold">{editingRecord ? 'Edit Attendance' : 'Mark Attendance'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker *</label>
                  <select 
                    required 
                    name="worker_id" 
                    value={formData.worker_id} 
                    onChange={handleInputChange} 
                    disabled={!!editingRecord}
                    className="w-full border rounded px-3 py-2 disabled:bg-gray-100 w-full sm:w-auto"
                  >
                    <option value={0}>Select Worker</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.employee_id} - {w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input required name="attendance_date" type="date" value={formData.attendance_date} onChange={handleInputChange} disabled={!!editingRecord} className="w-full border rounded px-3 py-2 disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select required name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="">Select Shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input name="check_in" type="time" value={formData.check_in || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input name="check_out" type="time" value={formData.check_out || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Hours</label>
                  <input name="overtime_hours" type="number" step="0.5" value={formData.overtime_hours} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea name="remarks" value={formData.remarks || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" rows={2}></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto">
                  {editingRecord ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pt-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Mark Daily Attendance ({filterDate})</h2>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-500 font-bold">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <table className="min-w-max w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">Employee ID</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">Existing Status</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">Mark Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workers.map(w => {
                    const existing = records.find(r => r.worker_id === w.id);
                    return (
                      <tr key={w.id}>
                        <td className="px-4 py-2">{w.employee_id}</td>
                        <td className="px-4 py-2 font-medium">{w.name}</td>
                        <td className="px-4 py-2">
                          {existing ? getStatusBadge(existing.status) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            value={bulkData[w.id!]} 
                            onChange={(e) => setBulkData({...bulkData, [w.id!]: e.target.value})}
                            disabled={!!existing}
                            className="border rounded px-2 py-1 w-full disabled:bg-gray-100"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Half Day">Half Day</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 border rounded hover:bg-white text-gray-700">Cancel</button>
              <button onClick={handleBulkSubmit} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Save New Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pt-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Attendance Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                <div className="text-gray-500 text-sm">Employee ID</div>
                <div className="font-medium">{viewingRecord.employee_id}</div>
                
                <div className="text-gray-500 text-sm">Name</div>
                <div className="font-medium">{viewingRecord.worker_name}</div>
                
                <div className="text-gray-500 text-sm">Department</div>
                <div className="font-medium">{viewingRecord.department}</div>
                
                <div className="text-gray-500 text-sm">Date</div>
                <div className="font-medium">{viewingRecord.attendance_date}</div>
                
                <div className="text-gray-500 text-sm">Status</div>
                <div>{getStatusBadge(viewingRecord.status)}</div>
                
                <div className="text-gray-500 text-sm">Shift</div>
                <div className="font-medium">{viewingRecord.shift || '-'}</div>

                <div className="text-gray-500 text-sm">Check In</div>
                <div className="font-medium">{viewingRecord.check_in || '-'}</div>

                <div className="text-gray-500 text-sm">Check Out</div>
                <div className="font-medium">{viewingRecord.check_out || '-'}</div>

                <div className="text-gray-500 text-sm">Overtime Hours</div>
                <div className="font-medium">{viewingRecord.overtime_hours || 0}h</div>
                
                <div className="text-gray-500 text-sm">Remarks</div>
                <div className="font-medium col-span-2 bg-gray-50 p-2 rounded">{viewingRecord.remarks || '-'}</div>
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

