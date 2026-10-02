import { useState, useEffect } from 'react';
import { getOrders, createOrder, updateOrder, deleteOrder } from '../services/orderService';
import type { Order } from '../services/orderService';
import { getCustomers } from '../services/customerService';
import type { Customer } from '../services/customerService';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterDelivery, setFilterDelivery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [formData, setFormData] = useState<Partial<Order>>({
    order_number: '', customer_id: 0, product_name: '', product_category: '',
    fabric_type: '', color: '', size_details: '', quantity: 0, completed_quantity: 0,
    order_date: new Date().toISOString().split('T')[0], 
    expected_delivery_date: '', priority: 'Normal', status: 'Pending', unit_price: 0, notes: ''
  });

  const [statusFormData, setStatusFormData] = useState({
    status: 'Pending',
    actual_delivery_date: ''
  });
  const [statusOrderId, setStatusOrderId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ords, custs] = await Promise.all([
        getOrders(
          searchQuery || undefined, 
          filterStatus || undefined, 
          filterPriority || undefined, 
          filterCustomerId ? parseInt(filterCustomerId) : undefined, 
          undefined, 
          undefined, 
          filterDelivery || undefined
        ),
        getCustomers()
      ]);
      setOrders(ords);
      setCustomers(custs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, filterStatus, filterPriority, filterCustomerId, filterDelivery]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleStatusInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStatusFormData({ ...statusFormData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingOrder(null);
    setFormData({
      order_number: '', customer_id: customers.length > 0 ? customers[0].id : 0, product_name: '', product_category: '',
      fabric_type: '', color: '', size_details: '', quantity: 0, completed_quantity: 0,
      order_date: new Date().toISOString().split('T')[0], 
      expected_delivery_date: '', priority: 'Normal', status: 'Pending', unit_price: 0, notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      order_number: order.order_number,
      customer_id: order.customer_id,
      product_name: order.product_name,
      product_category: order.product_category || '',
      fabric_type: order.fabric_type || '',
      color: order.color || '',
      size_details: order.size_details || '',
      quantity: order.quantity,
      completed_quantity: order.completed_quantity || 0,
      order_date: order.order_date,
      expected_delivery_date: order.expected_delivery_date,
      priority: order.priority || 'Normal',
      status: order.status || 'Pending',
      unit_price: order.unit_price || 0,
      notes: order.notes || ''
    });
    setIsModalOpen(true);
  };

  const openStatusModal = (order: Order) => {
    setStatusOrderId(order.id!);
    setStatusFormData({
      status: order.status || 'Pending',
      actual_delivery_date: order.actual_delivery_date || new Date().toISOString().split('T')[0]
    });
    setIsStatusModalOpen(true);
  };

  const openViewModal = (order: Order) => {
    setViewingOrder(order);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(id);
        showMessage("Order deleted successfully");
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete order');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.unit_price) submitData.unit_price = null as any;

      if (editingOrder && editingOrder.id) {
        await updateOrder(editingOrder.id, submitData);
        showMessage("Order updated successfully");
      } else {
        await createOrder(submitData as Order);
        showMessage("Order added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving order');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusOrderId) return;
    try {
      const updateData: Partial<Order> = { status: statusFormData.status };
      if (statusFormData.status === 'Delivered') {
        updateData.actual_delivery_date = statusFormData.actual_delivery_date;
      }
      
      await updateOrder(statusOrderId, updateData);
      showMessage("Order status updated successfully");
      setIsStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">Pending</span>;
      case 'Confirmed': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Confirmed</span>;
      case 'In Production': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">In Production</span>;
      case 'Quality Check': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Quality Check</span>;
      case 'Packing': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">Packing</span>;
      case 'Ready for Dispatch': return <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-semibold">Ready for Dispatch</span>;
      case 'Dispatched': return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">Dispatched</span>;
      case 'Delivered': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Delivered</span>;
      case 'Cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Cancelled</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Low': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">Low</span>;
      case 'Normal': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Normal</span>;
      case 'High': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">High</span>;
      case 'Urgent': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Urgent</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{priority}</span>;
    }
  };

  // Stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const inProduction = orders.filter(o => o.status === 'In Production').length;
  const completed = orders.filter(o => o.status === 'Delivered').length;
  const urgent = orders.filter(o => o.priority === 'Urgent').length;
  
  const todayDate = new Date().toISOString().split('T')[0];
  const overdue = orders.filter(o => o.expected_delivery_date < todayDate && o.status !== 'Delivered' && o.status !== 'Cancelled').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
        >
          + Create Order
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
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Total Orders</h2>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-gray-300">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Pending</h2>
          <div className="text-2xl font-bold">{pendingOrders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-purple-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">In Production</h2>
          <div className="text-2xl font-bold">{inProduction}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-green-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Delivered</h2>
          <div className="text-2xl font-bold">{completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-red-600">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Urgent</h2>
          <div className="text-2xl font-bold text-red-600">{urgent}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-orange-600">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Overdue</h2>
          <div className="text-2xl font-bold text-orange-600">{overdue}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <input 
            type="text" 
            placeholder="Search Order No, Product..." 
            className="flex-1 border rounded px-3 py-2 min-w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="border rounded px-3 py-2"
            value={filterCustomerId}
            onChange={(e) => setFilterCustomerId(e.target.value)}
          >
            <option value="">All Customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
          </select>
          <select 
            className="border rounded px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Production">In Production</option>
            <option value="Quality Check">Quality Check</option>
            <option value="Packing">Packing</option>
            <option value="Ready for Dispatch">Ready for Dispatch</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select 
            className="border rounded px-3 py-2"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <select 
            className="border rounded px-3 py-2"
            value={filterDelivery}
            onChange={(e) => setFilterDelivery(e.target.value)}
          >
            <option value="">All Delivery Dates</option>
            <option value="Today">Today</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Order No</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Customer</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Product</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Progress</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Delivery</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Priority</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const isOverdue = order.expected_delivery_date < todayDate && order.status !== 'Delivered' && order.status !== 'Cancelled';
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{order.customer_name}</td>
                      <td className="px-4 py-3 text-sm">{order.product_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${order.progress_percentage}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500">{order.progress_percentage}%</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{order.completed_quantity} / {order.quantity}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}>
                          {order.expected_delivery_date}
                        </span>
                        {isOverdue && <div className="text-xs text-red-600 font-semibold bg-red-100 rounded px-1 inline-block mt-1">Overdue</div>}
                      </td>
                      <td className="px-4 py-3 text-sm">{getPriorityBadge(order.priority || '')}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(order.status || '')}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openViewModal(order)} className="text-blue-600 hover:text-blue-800" title="View">View</button>
                          <button onClick={() => openEditModal(order)} className="text-gray-600 hover:text-gray-800" title="Edit">Edit</button>
                          <button onClick={() => openStatusModal(order)} className="text-green-600 hover:text-green-800" title="Status">Status</button>
                          <button onClick={() => handleDelete(order.id!)} className="text-red-600 hover:text-red-800" title="Delete">Delete</button>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">{editingOrder ? 'Edit Order' : 'Create Order'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number *</label>
                  <input required name="order_number" type="text" value={formData.order_number} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select required name="customer_id" value={formData.customer_id} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                    <option value={0}>Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_code} - {c.customer_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input required name="product_name" type="text" value={formData.product_name} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
                  <input name="product_category" type="text" value={formData.product_category || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
                  <input name="fabric_type" type="text" value={formData.fabric_type || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input name="color" type="text" value={formData.color || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size Details</label>
                  <input name="size_details" type="text" value={formData.size_details || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input required name="quantity" type="number" min="1" value={formData.quantity} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed Quantity</label>
                  <input name="completed_quantity" type="number" min="0" max={formData.quantity} value={formData.completed_quantity || 0} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input name="unit_price" type="number" step="0.01" min="0" value={formData.unit_price || 0} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                  <input required name="order_date" type="date" value={formData.order_date || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date *</label>
                  <input required name="expected_delivery_date" type="date" value={formData.expected_delivery_date || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Production">In Production</option>
                    <option value="Quality Check">Quality Check</option>
                    <option value="Packing">Packing</option>
                    <option value="Ready for Dispatch">Ready for Dispatch</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" rows={2}></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingOrder ? 'Update Order' : 'Create Order'}
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
              <h2 className="text-xl font-bold">Update Order Status</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            <form onSubmit={handleStatusSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Status *</label>
                  <select required name="status" value={statusFormData.status} onChange={handleStatusInputChange} className="w-full border rounded px-3 py-2">
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Production">In Production</option>
                    <option value="Quality Check">Quality Check</option>
                    <option value="Packing">Packing</option>
                    <option value="Ready for Dispatch">Ready for Dispatch</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                {statusFormData.status === 'Delivered' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Delivery Date *</label>
                    <input required name="actual_delivery_date" type="date" value={statusFormData.actual_delivery_date} onChange={handleStatusInputChange} className="w-full border rounded px-3 py-2" />
                  </div>
                )}
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
      {isViewModalOpen && viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Order Details: {viewingOrder.order_number}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                <div className="text-gray-500 text-sm">Customer</div>
                <div className="font-semibold">{viewingOrder.customer_name} ({viewingOrder.customer_code})</div>
                
                <div className="text-gray-500 text-sm">Company</div>
                <div className="font-medium">{viewingOrder.company_name || '-'}</div>

                <div className="text-gray-500 text-sm">Product Name</div>
                <div className="font-semibold">{viewingOrder.product_name}</div>
                
                <div className="text-gray-500 text-sm">Category</div>
                <div className="font-medium">{viewingOrder.product_category || '-'}</div>

                <div className="text-gray-500 text-sm">Fabric</div>
                <div className="font-medium">{viewingOrder.fabric_type || '-'}</div>
                
                <div className="text-gray-500 text-sm">Color</div>
                <div className="font-medium">{viewingOrder.color || '-'}</div>

                <div className="text-gray-500 text-sm">Size Details</div>
                <div className="font-medium col-span-3">{viewingOrder.size_details || '-'}</div>

                <div className="text-gray-500 text-sm mt-4 font-bold">Quantity Information</div>
                <div className="col-span-3"></div>

                <div className="text-gray-500 text-sm">Total Quantity</div>
                <div className="font-bold text-lg">{viewingOrder.quantity}</div>
                
                <div className="text-gray-500 text-sm">Completed</div>
                <div className="font-bold text-lg text-blue-600">{viewingOrder.completed_quantity}</div>

                <div className="text-gray-500 text-sm">Progress</div>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-full max-w-xs bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${viewingOrder.progress_percentage}%` }}></div>
                  </div>
                  <span className="font-bold">{viewingOrder.progress_percentage}%</span>
                </div>

                <div className="text-gray-500 text-sm mt-4 font-bold">Scheduling</div>
                <div className="col-span-3"></div>

                <div className="text-gray-500 text-sm">Order Date</div>
                <div className="font-medium">{viewingOrder.order_date}</div>

                <div className="text-gray-500 text-sm">Expected Delivery</div>
                <div className="font-medium">{viewingOrder.expected_delivery_date}</div>

                <div className="text-gray-500 text-sm">Actual Delivery</div>
                <div className="font-medium">{viewingOrder.actual_delivery_date || '-'}</div>
                
                <div className="col-span-2"></div>

                <div className="text-gray-500 text-sm mt-4 font-bold">Status & Pricing</div>
                <div className="col-span-3"></div>

                <div className="text-gray-500 text-sm">Priority</div>
                <div>{getPriorityBadge(viewingOrder.priority || '')}</div>
                
                <div className="text-gray-500 text-sm">Status</div>
                <div>{getStatusBadge(viewingOrder.status || '')}</div>

                <div className="text-gray-500 text-sm">Unit Price</div>
                <div className="font-medium">{viewingOrder.unit_price ? `$${viewingOrder.unit_price}` : '-'}</div>

                <div className="text-gray-500 text-sm">Total Amount</div>
                <div className="font-bold text-green-700">{viewingOrder.total_amount ? `$${viewingOrder.total_amount}` : '-'}</div>

                <div className="text-gray-500 text-sm col-span-4 mt-2">Notes</div>
                <div className="font-medium col-span-4 bg-gray-50 p-3 rounded text-sm">{viewingOrder.notes || '-'}</div>
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
