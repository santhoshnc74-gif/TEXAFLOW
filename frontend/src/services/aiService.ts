import api from './api';

export interface AIStatus {
  model_available: boolean;
  prediction_mode: string;
  model_version?: string;
  trained_at?: string;
  training_records: number;
  evaluation_metrics?: any;
}

export interface PredictionResponse {
  production_id: number;
  production_code: string;
  prediction_mode: string;
  completion_percentage: number;
  remaining_quantity: number;
  average_daily_production: number;
  required_daily_production: number;
  predicted_remaining_days: number;
  predicted_completion_date: string;
  expected_delivery_date: string;
  predicted_delay_days: number;
  delay_risk: string;
  current_workers: number;
  required_workers: number;
  extra_workers_required: number;
  labour_shortage: boolean;
  overtime_recommended: boolean;
  suggested_overtime_hours: number;
  explanation?: string;
}

export interface PredictionHistory {
  id: number;
  production_id: number;
  order_id: number;
  prediction_type: string;
  prediction_mode: string;
  predicted_completion_date?: string;
  predicted_remaining_days?: number;
  delay_risk?: string;
  predicted_delay_days?: number;
  current_workers?: number;
  required_workers?: number;
  extra_workers_required?: number;
  overtime_recommended: boolean;
  suggested_overtime_hours?: number;
  completion_percentage?: number;
  model_version?: string;
  created_at: string;
}

export const getAIStatus = async (): Promise<AIStatus> => {
  const response = await api.get('/api/ai/status');
  return response.data;
};

export const trainAIModel = async () => {
  const response = await api.post('/api/ai/train');
  return response.data;
};

export const predictProduction = async (productionId: number): Promise<PredictionResponse> => {
  const response = await api.get(`/api/ai/predict/production/${productionId}`);
  return response.data;
};

export const predictOrder = async (orderId: number): Promise<PredictionResponse> => {
  const response = await api.get(`/api/ai/predict/order/${orderId}`);
  return response.data;
};

export const getPredictionHistory = async (productionId: number): Promise<PredictionHistory[]> => {
  const response = await api.get(`/api/ai/history/${productionId}`);
  return response.data;
};
