import api from './api';

export const getDashboardSummary = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const response = await api.get(`/api/dashboard/summary?${params.toString()}`);
  return response.data;
};

export const getWorkforceAnalytics = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const response = await api.get(`/api/analytics/workforce?${params.toString()}`);
  return response.data;
};

export const getMachineAnalytics = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const response = await api.get(`/api/analytics/machines?${params.toString()}`);
  return response.data;
};

export const getOrderAnalytics = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const response = await api.get(`/api/analytics/orders?${params.toString()}`);
  return response.data;
};

export const getProductionAnalytics = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const response = await api.get(`/api/analytics/production?${params.toString()}`);
  return response.data;
};
