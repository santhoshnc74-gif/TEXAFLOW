import api from './api';

export interface Attendance {
  id?: number;
  worker_id: number;
  attendance_date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  shift?: string;
  overtime_hours?: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  
  // Flattened for easy display
  employee_id?: string;
  worker_name?: string;
  department?: string;
}

export const getAttendance = async (date?: string, worker_id?: number, status?: string) => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (worker_id) params.append('worker_id', worker_id.toString());
  if (status) params.append('status', status);
  
  const response = await api.get(`/api/attendance?${params.toString()}`);
  return response.data;
};

export const getAttendanceById = async (id: number) => {
  const response = await api.get(`/api/attendance/${id}`);
  return response.data;
};

export const createAttendance = async (data: Attendance) => {
  const response = await api.post('/api/attendance', data);
  return response.data;
};

export const updateAttendance = async (id: number, data: Partial<Attendance>) => {
  const response = await api.put(`/api/attendance/${id}`, data);
  return response.data;
};

export const deleteAttendance = async (id: number) => {
  const response = await api.delete(`/api/attendance/${id}`);
  return response.data;
};

export const createBulkAttendance = async (records: Attendance[]) => {
  const response = await api.post('/api/attendance/bulk', { records });
  return response.data;
};
