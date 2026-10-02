import api from './api';

export interface ProductionStage {
  id?: number;
  stage_name: string;
  department?: string;
  sequence_number: number;
  target_quantity: number;
  completed_quantity?: number;
  rejected_quantity?: number;
  status?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  notes?: string;
}

export interface Production {
  id?: number;
  production_code: string;
  order_id: number;
  department: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  target_quantity: number;
  completed_quantity?: number;
  rejected_quantity?: number;
  remaining_quantity?: number;
  status?: string;
  progress_percentage?: number;
  priority?: string;
  supervisor_id?: number;
  notes?: string;

  order_number?: string;
  customer_name?: string;
  product_name?: string;
  supervisor_name?: string;
  stages?: ProductionStage[];
}

export interface ProductionUpdate {
  id?: number;
  production_id: number;
  stage_id?: number;
  production_date: string;
  worker_id?: number;
  machine_id?: number;
  quantity_produced: number;
  rejected_quantity: number;
  working_hours?: number;
  overtime_hours?: number;
  remarks?: string;

  stage_name?: string;
  worker_name?: string;
  machine_name?: string;
}

export const getProductions = async (search?: string, status?: string, department?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (department) params.append('department', department);
  const response = await api.get(`/api/production?${params.toString()}`);
  return response.data;
};

export const getProduction = async (id: number) => {
  const response = await api.get(`/api/production/${id}`);
  return response.data;
};

export const createProduction = async (data: any) => {
  const response = await api.post('/api/production', data);
  return response.data;
};

export const deleteProduction = async (id: number) => {
  const response = await api.delete(`/api/production/${id}`);
  return response.data;
};

export const addProductionUpdate = async (id: number, data: any) => {
  const response = await api.post(`/api/production/${id}/updates`, data);
  return response.data;
};

export const getProductionUpdates = async (id: number) => {
  const response = await api.get(`/api/production/${id}/updates`);
  return response.data;
};
