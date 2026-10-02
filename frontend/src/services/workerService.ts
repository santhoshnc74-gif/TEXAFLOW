import api from './api';

export interface Worker {
  id?: number;
  employee_id: string;
  name: string;
  department: string;
  designation?: string;
  phone?: string;
  email?: string;
  shift?: string;
  joining_date?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const getWorkers = async () => {
  const response = await api.get('/api/workers');
  return response.data;
};

export const getWorker = async (id: number) => {
  const response = await api.get(`/api/workers/${id}`);
  return response.data;
};

export const createWorker = async (data: Worker) => {
  const response = await api.post('/api/workers', data);
  return response.data;
};

export const updateWorker = async (id: number, data: Partial<Worker>) => {
  const response = await api.put(`/api/workers/${id}`, data);
  return response.data;
};

export const deleteWorker = async (id: number) => {
  const response = await api.delete(`/api/workers/${id}`);
  return response.data;
};

export const searchWorkers = async (q?: string, department?: string, status?: string) => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (department) params.append('department', department);
  if (status) params.append('status', status);
  
  const response = await api.get(`/api/workers/search?${params.toString()}`);
  return response.data;
};
