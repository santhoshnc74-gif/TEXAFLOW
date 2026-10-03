import re

with open('frontend/src/pages/AIPredictions.tsx', 'r') as f:
    content = f.read()

replacement = '''import React, { useState, useEffect } from 'react';
import { getAIStatus, trainAIModel, predictProduction, getPredictionHistory } from '../services/aiService';
import type { AIStatus, PredictionResponse, PredictionHistory } from '../services/aiService';
import { getProductions } from '../services/productionService';
import type { Production } from '../services/productionService';
import ImportHistoricalDataModal from '../components/ImportHistoricalDataModal';

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
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
      setProductions(data.filter((p: any) => p.status !== 'Completed' && p.status !== 'Cancelled'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrain = async () => {
    if (!confirm('Are you sure you want to retrain the ML models? This requires at least 10 completed historical production records.')) return;
    
    setTraining(true);
    setMessage(null);
    setError(null);
    try {
      const result = await trainAIModel();
      if (result.status === 'success') {
        setMessage(Training successful. Found \ records.);
      } else {
        setError(result.message);
      }
      fetchStatus();
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to train model');
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
      setError(e.response?.data?.detail || 'Prediction failed');
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

  const completedRecords = status?.completed_records_count || 0;
  const canTrain = completedRecords >= 10;
  const accuracy = status?.evaluation_metrics?.delay_accuracy;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">AI Production Prediction</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow transition"
          >
            Import Historical Data
          </button>
          <button 
            onClick={handleTrain} 
            disabled={training || !canTrain}
            className={w-full sm:w-auto px-4 py-2 rounded text-white font-semibold shadow transition \}
            title={!canTrain ? 'Need at least 10 completed records' : ''}
          >
            {training ? 'Training...' : 'Train ML Model'}
          </button>
        </div>
      </div>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-blue-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Model Status</h2>
          <div className="text-xl font-bold flex items-center gap-2">
            <span className={w-3 h-3 rounded-full \}></span>
            {status?.model_available ? 'Trained' : 'Rule-Based'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-green-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Completed Records</h2>
          <div className="text-xl font-bold">{completedRecords}</div>
          {!canTrain && <div className="text-xs text-red-500 mt-1">Need at least 10</div>}
          {canTrain && !status?.model_available && <div className="text-xs text-green-600 mt-1">Ready for training</div>}
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-purple-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Last Trained</h2>
          <div className="text-lg font-bold">{status?.trained_at ? new Date(status.trained_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-orange-500">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Prediction Accuracy</h2>
          <div className="text-xl font-bold">{accuracy !== undefined ? \\%\ : 'N/A'}</div>
        </div>
      </div>
      
      {/* Predictor */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">'''

content = re.sub(r'^.*?<div className="bg-white rounded-lg shadow p-6 mb-6">', replacement, content, flags=re.DOTALL)

content = content.replace('</div>\n  );\n}', '  <ImportHistoricalDataModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => { setIsImportModalOpen(false); fetchStatus(); }} />\n    </div>\n  );\n}')

with open('frontend/src/pages/AIPredictions.tsx', 'w') as f:
    f.write(content)
