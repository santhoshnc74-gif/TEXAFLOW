import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService';
import type { Customer } from '../services/customerService';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({
    customer_code: '', customer_name: '', company_name: '', email: '', phone: '',
    address: '', city: '', state: '', country: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers(searchQuery || undefined);
      setCustomers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      customer_code: '', customer_name: '', company_name: '', email: '', phone: '',
      address: '', city: '', state: '', country: '', notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_code: customer.customer_code,
      customer_name: customer.customer_name,
      company_name: customer.company_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  const openViewModal = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        showMessage("Customer deleted successfully");
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete customer');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer && editingCustomer.id) {
        await updateCustomer(editingCustomer.id, formData);
        showMessage("Customer updated successfully");
      } else {
        await createCustomer(formData as Customer);
        showMessage("Customer added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving customer');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <div className="flex flex-col"><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Customers</h1><p className="text-sm text-slate-500 mt-1">Manage customer relationships.</p></div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto"
        >
          + Add Customer
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

      <div className="bg-white rounded-lg shadow border border-slate-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <input 
            type="text" 
            placeholder="Search Customer Code, Name, Company, Email..." 
            className="flex-1 border rounded px-3 py-2 min-w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Code</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Customer Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Company</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Phone</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">City</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm">Orders</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm font-medium">{cust.customer_code}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{cust.customer_name}</td>
                    <td className="px-4 py-3 text-sm">{cust.company_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{cust.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm">{cust.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">{cust.city || '-'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600">{cust.order_count || 0}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openViewModal(cust)} className="text-blue-600 hover:text-blue-800" title="View">View</button>
                        <button onClick={() => openEditModal(cust)} className="text-slate-600 hover:text-slate-800" title="Edit">Edit</button>
                        <button onClick={() => handleDelete(cust.id!)} className="text-red-600 hover:text-red-800" title="Delete">Delete</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Code *</label>
                  <input required name="customer_code" type="text" value={formData.customer_code} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                  <input required name="customer_name" type="text" value={formData.customer_name} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <input name="company_name" type="text" value={formData.company_name || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input name="email" type="email" value={formData.email || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input name="phone" type="text" value={formData.phone || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input name="address" type="text" value={formData.address || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input name="city" type="text" value={formData.city || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input name="state" type="text" value={formData.state || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input name="country" type="text" value={formData.country || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} className="w-full border rounded px-3 py-2" rows={2}></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-slate-700 hover:bg-slate-50 transition-colors duration-150">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto">
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Customer Details: {viewingCustomer.customer_code}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-500 hover:text-slate-700 font-bold">&times;</button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                <div className="text-slate-500 text-sm">Customer Name</div>
                <div className="font-semibold">{viewingCustomer.customer_name}</div>
                
                <div className="text-slate-500 text-sm">Company Name</div>
                <div className="font-medium">{viewingCustomer.company_name || '-'}</div>
                
                <div className="text-slate-500 text-sm">Email</div>
                <div className="font-medium">{viewingCustomer.email || '-'}</div>
                
                <div className="text-slate-500 text-sm">Phone</div>
                <div className="font-medium">{viewingCustomer.phone || '-'}</div>

                <div className="text-slate-500 text-sm">Address</div>
                <div className="font-medium">{viewingCustomer.address || '-'}</div>
                
                <div className="text-slate-500 text-sm">City / State / Country</div>
                <div className="font-medium">
                  {viewingCustomer.city || '-'}, {viewingCustomer.state || '-'}, {viewingCustomer.country || '-'}
                </div>

                <div className="text-slate-500 text-sm">Total Orders</div>
                <div className="font-bold text-blue-600">{viewingCustomer.order_count || 0}</div>
                
                <div className="text-slate-500 text-sm col-span-2 mt-2">Notes</div>
                <div className="font-medium col-span-2 bg-slate-50 p-3 rounded text-sm">{viewingCustomer.notes || '-'}</div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 border rounded bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-150">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
