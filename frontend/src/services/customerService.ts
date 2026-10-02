import api from './api';

export interface Customer {
  id?: number;
  customer_code: string;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  order_count?: number;
}

export const getCustomers = async (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const response = await api.get(`/api/customers?${params.toString()}`);
  return response.data;
};

export const getCustomer = async (id: number) => {
  const response = await api.get(`/api/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data: Customer) => {
  const response = await api.post('/api/customers', data);
  return response.data;
};

export const updateCustomer = async (id: number, data: Partial<Customer>) => {
  const response = await api.put(`/api/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: number) => {
  const response = await api.delete(`/api/customers/${id}`);
  return response.data;
};
