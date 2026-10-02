import api from './api';

export interface Order {
  id?: number;
  order_number: string;
  customer_id: number;
  product_name: string;
  product_category?: string;
  fabric_type?: string;
  color?: string;
  size_details?: string;
  quantity: number;
  completed_quantity?: number;
  order_date: string;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  priority?: string;
  status?: string;
  unit_price?: number;
  total_amount?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  progress_percentage?: number;
  customer_code?: string;
  customer_name?: string;
  company_name?: string;
}

export const getOrders = async (
  search?: string, 
  status?: string, 
  priority?: string, 
  customer_id?: number, 
  order_date?: string, 
  expected_delivery_date?: string,
  delivery_filter?: string
) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  if (customer_id) params.append('customer_id', customer_id.toString());
  if (order_date) params.append('order_date', order_date);
  if (expected_delivery_date) params.append('expected_delivery_date', expected_delivery_date);
  if (delivery_filter) params.append('delivery_filter', delivery_filter);
  
  const response = await api.get(`/api/orders?${params.toString()}`);
  return response.data;
};

export const getOrder = async (id: number) => {
  const response = await api.get(`/api/orders/${id}`);
  return response.data;
};

export const createOrder = async (data: Order) => {
  const response = await api.post('/api/orders', data);
  return response.data;
};

export const updateOrder = async (id: number, data: Partial<Order>) => {
  const response = await api.put(`/api/orders/${id}`, data);
  return response.data;
};

export const deleteOrder = async (id: number) => {
  const response = await api.delete(`/api/orders/${id}`);
  return response.data;
};
