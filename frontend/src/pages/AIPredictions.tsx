import { useState, useEffect } from 'react';
import { getAIStatus, trainAIModel, predictProduction, getPredictionHistory } from '../services/aiService';
import type { AIStatus, PredictionResponse, PredictionHistory } from '../services/aiService';
import { getProductions } from '../services/productionService';
import type { Production } from '../services/productionService';

export default function AIPredictions() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<number | ''>('');
  
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchProductions();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await getAIStatus();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProductions = async () => {
    try {
      const data = await getProductions();
      // Only show non-completed for prediction ideally, but allow all for testing
      setProductions(data.filter((p: any) => p.status !== 'Completed' && p.status !== 'Cancelled'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrain = async () => {
    if (!confirm("Are you sure you want to retrain the ML models? This requires at least 10 completed historical production records.")) return;
    
    setTraining(true);
    setMessage(null);
    setError(null);
    try {
      const result = await trainAIModel();
      if (result.status === 'success') {
        setMessage(`Training successful. Found ${result.metadata.training_records} records.`);
      } else {
        setError(result.message);
      }
      fetchStatus();
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || "Failed to train model");
    }
    setTraining(false);
  };

  const handlePredict = async () => {
    if (!selectedProdId) return;
    
    setLoading(true);
    setError(null);
    try {
      const pred = await predictProduction(selectedProdId as number);
      setPrediction(pred);
      
      const hist = await getPredictionHistory(selectedProdId as number);
      setHistory(hist);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Prediction failed");
    }
    setLoading(false);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">Low Risk</span>;
      case 'Medium': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">Medium Risk</span>;
      case 'High': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">High Risk</span>;
      default: return <span>{risk}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">AI Production Prediction</h1>
        <button 
          onClick={handleTrain} 
          disabled={training}
          className={`w-full sm:w-auto px-4 py-2 rounded text-white font-semibold shadow transition ${training ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {training ? 'Training...' : 'Train ML Model'}
        </button>
      </div>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Model Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-6 items-center">
        <div>
          <span className="text-sm text-gray-500 block">AI Engine Status</span>
          <span className="font-bold text-lg flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${status?.model_available ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {status?.model_available ? 'Active (ML Mode)' : 'Rule-Based Mode'}
          </span>
        </div>
        {status?.model_available && (
          <>
            <div>
              <span className="text-sm text-gray-500 block">Training Records</span>
              <span className="font-semibold">{status.training_records}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Last Trained</span>
              <span className="font-semibold">{status.trained_at ? new Date(status.trained_at).toLocaleString() : '-'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Model Version</span>
              <span className="font-semibold">{status.model_version}</span>
            </div>
          </>
        )}
        {!status?.model_available && (
          <div className="text-sm text-gray-600 italic border-l pl-4 border-gray-300">
            More historical production data is needed for trained ML predictions. Fallback rule-based estimation is currently active.
          </div>
        )}
      </div>

      {/* Predictor */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Generate Prediction</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={selectedProdId} 
            onChange={(e) => setSelectedProdId(e.target.value ? parseInt(e.target.value) : '')}
            className="flex-1 w-full border rounded px-3 py-2"
          >
            <option value="">Select an active production plan...</option>
            {productions.map(p => (
              <option key={p.id} value={p.id}>
                {p.production_code} - {p.product_name} ({p.progress_percentage}% completed)
              </option>
            ))}
          </select>
          <button 
            onClick={handlePredict}
            disabled={!selectedProdId || loading}
            className={`w-full sm:w-auto px-6 py-2 rounded text-white font-bold transition ${!selectedProdId || loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Predicting...' : 'Predict'}
          </button>
        </div>
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">Prediction Engine Explanation</h3>
            <p className="text-blue-800">{prediction.explanation}</p>
            <div className="mt-2 inline-block px-2 py-1 bg-white rounded text-xs font-bold text-gray-600 uppercase tracking-wider border">
              MODE: {prediction.prediction_mode === 'ml' ? 'Machine Learning' : 'Rule-Based Estimate'}
            </div>
          </div>

          {/* Schedule Risk */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-t-blue-500">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Schedule & Risk</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Predicted Completion Date</div>
                <div className="text-2xl font-bold">{prediction.predicted_completion_date}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Expected Delivery</div>
                <div className="text-lg font-semibold text-gray-700">{prediction.expected_delivery_date}</div>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-sm font-semibold text-gray-600">Delay Risk</span>
                {getRiskBadge(prediction.delay_risk)}
              </div>
              {prediction.predicted_delay_days > 0 && (
                <div className="text-sm text-red-600 font-bold bg-red-50 p-2 rounded text-center">
                  Predicted {prediction.predicted_delay_days} days late
                </div>
              )}
            </div>
          </div>

          {/* Production Analysis */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-t-green-500">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Production Pace</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Completion</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 h-2 rounded-full">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${prediction.completion_percentage}%` }}></div>
                  </div>
                  <span className="font-bold">{prediction.completion_percentage}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-gray-500">Current Rate</div>
                  <div className="font-bold">{prediction.average_daily_production} <span className="text-xs font-normal">/day</span></div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Required Rate</div>
                  <div className="font-bold">{prediction.required_daily_production} <span className="text-xs font-normal">/day</span></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500">Estimated Days Remaining</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{prediction.predicted_remaining_days} days</div>
              </div>
            </div>
          </div>

          {/* Workforce Analysis */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-t-orange-500">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Labour & Overtime</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-gray-500">Current Workers</div>
                  <div className="font-bold text-xl">{prediction.current_workers}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Required Workers</div>
                  <div className="font-bold text-xl">{prediction.required_workers}</div>
                </div>
              </div>
              
              {prediction.labour_shortage ? (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-2 rounded text-sm font-semibold text-center">
                  Shortage: Need {prediction.extra_workers_required} more workers
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm font-semibold text-center">
                  Workforce is sufficient
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Overtime Recommended</span>
                  <span className="font-bold">{prediction.overtime_recommended ? 'YES' : 'NO'}</span>
                </div>
                {prediction.overtime_recommended && (
                  <div className="text-center font-bold text-purple-600 bg-purple-50 p-2 rounded mt-2">
                    Suggest ~{prediction.suggested_overtime_hours} hrs/day
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Prediction History for {prediction?.production_code}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-2">Date Generated</th>
                  <th className="p-2">Mode</th>
                  <th className="p-2">Completion %</th>
                  <th className="p-2">Predicted End</th>
                  <th className="p-2">Delay Risk</th>
                  <th className="p-2">Req. Workers</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="p-2 text-gray-600">{new Date(h.created_at).toLocaleString()}</td>
                    <td className="p-2 font-mono text-xs">{h.prediction_mode}</td>
                    <td className="p-2 font-semibold">{h.completion_percentage}%</td>
                    <td className="p-2">{h.predicted_completion_date}</td>
                    <td className="p-2">{getRiskBadge(h.delay_risk || 'Unknown')}</td>
                    <td className="p-2">{h.required_workers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



