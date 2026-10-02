import api from './api';

export interface Machine {
  id?: number;
  machine_code: string;
  machine_name: string;
  machine_type: string;
  department: string;
  brand?: string;
  model?: string;
  installation_date?: string;
  status: string;
  condition: string;
  current_operator_id?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  operator_name?: string;
}

export interface MachineStatusHistory {
  id: number;
  machine_id: number;
  previous_status?: string;
  new_status: string;
  changed_at: string;
  reason?: string;
  downtime_minutes: number;
  notes?: string;
}

export const getMachines = async (search?: string, machine_type?: string, department?: string, status?: string, condition?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (machine_type) params.append('machine_type', machine_type);
  if (department) params.append('department', department);
  if (status) params.append('status', status);
  if (condition) params.append('condition', condition);
  
  const response = await api.get(`/api/machines?${params.toString()}`);
  return response.data;
};

export const getMachine = async (id: number) => {
  const response = await api.get(`/api/machines/${id}`);
  return response.data;
};

export const createMachine = async (data: Machine) => {
  const response = await api.post('/api/machines', data);
  return response.data;
};

export const updateMachine = async (id: number, data: Partial<Machine>) => {
  const response = await api.put(`/api/machines/${id}`, data);
  return response.data;
};

export const deleteMachine = async (id: number) => {
  const response = await api.delete(`/api/machines/${id}`);
  return response.data;
};

export const updateMachineStatus = async (id: number, data: {status: string, reason?: string, downtime_minutes?: number, notes?: string}) => {
  const response = await api.put(`/api/machines/${id}/status`, data);
  return response.data;
};

export const getMachineHistory = async (id: number) => {
  const response = await api.get(`/api/machines/${id}/history`);
  return response.data;
};
