import { useState, useEffect } from 'react';
import { getProductions, createProduction, deleteProduction, addProductionUpdate, getProductionUpdates } from '../services/productionService';
import type { Production, ProductionUpdate } from '../services/productionService';
import { getOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import { getWorkers } from '../services/workerService';
import type { Worker } from '../services/workerService';
import { getMachines } from '../services/machineService';
import type { Machine } from '../services/machineService';

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [formData, setFormData] = useState<any>({
    production_code: '', order_id: 0, department: '', 
    planned_start_date: '', planned_end_date: '', target_quantity: 0,
    priority: 'Normal', supervisor_id: 0, notes: '', stages: []
  });

  const [updateFormData, setUpdateFormData] = useState<any>({
    production_id: 0, stage_id: 0, production_date: new Date().toISOString().split('T')[0],
    worker_id: 0, machine_id: 0, quantity_produced: 0, rejected_quantity: 0, remarks: ''
  });
  
  const [viewingProduction, setViewingProduction] = useState<Production | null>(null);
  const [viewingUpdates, setViewingUpdates] = useState<ProductionUpdate[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, ords, wrks, machs] = await Promise.all([
        getProductions(), getOrders(), getWorkers(), getMachines()
      ]);
      setProductions(prods);
      setOrders(ords);
      setWorkers(wrks);
      setMachines(machs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateChange = (e: any) => {
    setUpdateFormData({ ...updateFormData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        order_id: parseInt(formData.order_id),
        target_quantity: parseInt(formData.target_quantity),
        supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id) : null
      };
      
      // Basic stages added by default for now
      payload.stages = [
        { stage_name: 'Cutting', sequence_number: 1, target_quantity: payload.target_quantity },
        { stage_name: 'Stitching', sequence_number: 2, target_quantity: payload.target_quantity },
        { stage_name: 'Quality Check', sequence_number: 3, target_quantity: payload.target_quantity },
        { stage_name: 'Packing', sequence_number: 4, target_quantity: payload.target_quantity }
      ];

      await createProduction(payload);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error creating production");
    }
  };

  const handleUpdateSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        production_date: updateFormData.production_date,
        stage_id: updateFormData.stage_id ? parseInt(updateFormData.stage_id) : null,
        worker_id: updateFormData.worker_id ? parseInt(updateFormData.worker_id) : null,
        machine_id: updateFormData.machine_id ? parseInt(updateFormData.machine_id) : null,
        quantity_produced: parseInt(updateFormData.quantity_produced),
        rejected_quantity: parseInt(updateFormData.rejected_quantity),
        remarks: updateFormData.remarks
      };
      await addProductionUpdate(updateFormData.production_id, payload);
      setIsUpdateModalOpen(false);
      fetchData();
      if (viewingProduction && viewingProduction.id === updateFormData.production_id) {
        openViewModal(productions.find(p => p.id === updateFormData.production_id)!);
      }
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error updating production");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this production plan?")) {
      await deleteProduction(id);
      fetchData();
    }
  };

  const openViewModal = async (prod: Production) => {
    setViewingProduction(prod);
    const updates = await getProductionUpdates(prod.id!);
    setViewingUpdates(updates);
    setIsViewModalOpen(true);
  };

  const openUpdateModal = (prod: Production) => {
    setUpdateFormData({
      production_id: prod.id,
      stage_id: prod.stages?.[0]?.id || 0,
      production_date: new Date().toISOString().split('T')[0],
      worker_id: 0,
      machine_id: 0,
      quantity_produced: 0,
      rejected_quantity: 0,
      remarks: ''
    });
    setIsUpdateModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Planned': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Delayed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <div className="flex flex-col"><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Production Tracking</h1><p className="text-sm text-slate-500 mt-1">Monitor live manufacturing batches.</p></div>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto">
          + Create Production Plan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Prod Code</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Order No</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Dept</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Progress</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Timeline</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
              ) : productions.map(prod => {
                const today = new Date().toISOString().split('T')[0];
                const isDelayed = prod.planned_end_date < today && prod.status !== 'Completed';
                return (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm font-medium">{prod.production_code}</td>
                    <td className="px-4 py-3 text-sm">{prod.order_number}</td>
                    <td className="px-4 py-3 text-sm">{prod.department}</td>
                    <td className="px-4 py-3 text-sm w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${(prod.progress_percentage || 0) >= 100 ? "bg-green-500" : (prod.progress_percentage || 0) > 60 ? "bg-blue-500" : "bg-orange-500"}`} style={{ width: `${prod.progress_percentage || 0}%` }}></div>
                        </div>
                        <span className="text-xs">{prod.progress_percentage}%</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{prod.completed_quantity} / {prod.target_quantity}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-xs text-slate-500">{prod.planned_start_date} to</div>
                      <div className={isDelayed ? 'text-red-600 font-bold' : ''}>{prod.planned_end_date}</div>
                      {isDelayed && <span className="text-[10px] bg-red-50 text-red-700 border-red-200 px-1 rounded">Delayed</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(prod.status || '')}`}>{prod.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button onClick={() => openViewModal(prod)} className="text-blue-600 hover:underline mr-2">View</button>
                      <button onClick={() => openUpdateModal(prod)} className="text-green-600 hover:underline mr-2">Update</button>
                      <button onClick={() => handleDelete(prod.id!)} className="text-red-600 hover:underline">Del</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Create Production Plan</h2>
            <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Production Code *</label>
                <input required name="production_code" onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order *</label>
                <select required name="order_id" onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                  <option value="">Select Order</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} - {o.customer_name} ({o.quantity})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department *</label>
                <input required name="department" onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Quantity *</label>
                <input required type="number" name="target_quantity" onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Planned Start Date *</label>
                <input required type="date" name="planned_start_date" onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Planned End Date *</label>
                <input required type="date" name="planned_end_date" onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supervisor</label>
                <select name="supervisor_id" onChange={handleInputChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                  <option value="">None</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.employee_id} - {w.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Update Daily Production</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Date</label>
                  <input required type="date" name="production_date" value={updateFormData.production_date} onChange={handleUpdateChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Stage</label>
                  <select name="stage_id" value={updateFormData.stage_id} onChange={handleUpdateChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="">Select Stage</option>
                    {productions.find(p => p.id === updateFormData.production_id)?.stages?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.stage_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Quantity Produced *</label>
                  <input required type="number" min="0" name="quantity_produced" onChange={handleUpdateChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Rejected Quantity</label>
                  <input required type="number" min="0" name="rejected_quantity" value={updateFormData.rejected_quantity} onChange={handleUpdateChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Worker</label>
                  <select name="worker_id" onChange={handleUpdateChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="">None</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Machine</label>
                  <select name="machine_id" onChange={handleUpdateChange} className="w-full border rounded px-3 py-2 w-full sm:w-auto">
                    <option value="">None</option>
                    {machines.filter(m => m.status === 'Running' || m.status === 'Idle').map(m => <option key={m.id} value={m.id}>{m.machine_code}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Remarks</label>
                  <input type="text" name="remarks" onChange={handleUpdateChange} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingProduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Production Details: {viewingProduction.production_code}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-500 hover:text-black text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-lg">
                <div>
                  <div className="text-xs text-slate-500">Order</div>
                  <div className="font-bold">{viewingProduction.order_number}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Customer</div>
                  <div className="font-bold">{viewingProduction.customer_name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Product</div>
                  <div className="font-bold">{viewingProduction.product_name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="font-bold">{viewingProduction.status}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Target Qty</div>
                  <div className="font-bold text-lg">{viewingProduction.target_quantity}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Completed Qty</div>
                  <div className="font-bold text-lg text-green-600">{viewingProduction.completed_quantity}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Remaining Qty</div>
                  <div className="font-bold text-lg text-blue-600">{viewingProduction.remaining_quantity}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Rejected Qty</div>
                  <div className="font-bold text-lg text-red-600">{viewingProduction.rejected_quantity}</div>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2">Production Stages</h3>
              <table className="w-full mb-8 border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left text-sm">Stage</th>
                    <th className="p-2 text-left text-sm">Target</th>
                    <th className="p-2 text-left text-sm">Completed</th>
                    <th className="p-2 text-left text-sm">Rejected</th>
                    <th className="p-2 text-left text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingProduction.stages?.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="p-2 text-sm">{s.stage_name}</td>
                      <td className="p-2 text-sm">{s.target_quantity}</td>
                      <td className="p-2 text-sm text-green-600 font-bold">{s.completed_quantity}</td>
                      <td className="p-2 text-sm text-red-600">{s.rejected_quantity}</td>
                      <td className="p-2 text-sm">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="font-bold text-lg mb-2">Daily Updates History</h3>
              <table className="min-w-max w-full border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left text-sm">Date</th>
                    <th className="p-2 text-left text-sm">Stage</th>
                    <th className="p-2 text-left text-sm">Produced</th>
                    <th className="p-2 text-left text-sm">Rejected</th>
                    <th className="p-2 text-left text-sm">Worker</th>
                    <th className="p-2 text-left text-sm">Machine</th>
                    <th className="p-2 text-left text-sm">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingUpdates.map(u => (
                    <tr key={u.id} className="border-b">
                      <td className="p-2 text-sm">{u.production_date}</td>
                      <td className="p-2 text-sm">{u.stage_name || '-'}</td>
                      <td className="p-2 text-sm text-green-600 font-bold">+{u.quantity_produced}</td>
                      <td className="p-2 text-sm text-red-600">{u.rejected_quantity > 0 ? `+${u.rejected_quantity}` : '-'}</td>
                      <td className="p-2 text-sm">{u.worker_name || '-'}</td>
                      <td className="p-2 text-sm">{u.machine_name || '-'}</td>
                      <td className="p-2 text-sm">{u.remarks || '-'}</td>
                    </tr>
                  ))}
                  {viewingUpdates.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-slate-500">No updates recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


