import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../services/dashboardService';

export default function Dashboard() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendMessage, setBackendMessage] = useState('Checking...');
  const [dateFilter, setDateFilter] = useState('last30');
  
  const [summary, setSummary] = useState<any>(null);
  
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
        const res = await fetch(`${baseUrl}/api/health`);
        if (isMounted) {
          if (res.ok) {
            const data = await res.json();
            setBackendStatus('connected');
            setBackendMessage(data.message || 'Connected to backend');
            fetchSummary();
          } else {
            setBackendStatus('disconnected');
            setBackendMessage('Backend returned error');
          }
        }
      } catch (err) {
        if (isMounted) {
          setBackendStatus('disconnected');
          setBackendMessage('Cannot connect to backend server');
        }
      }
    };
    checkBackend();
    return () => { isMounted = false; };
  }, [dateFilter]);

  const fetchSummary = async () => {
    try {
      const today = new Date();
      let start_date = '';
      let end_date = today.toISOString().split('T')[0];
      
      if (dateFilter === 'today') {
        start_date = end_date;
      } else if (dateFilter === 'last7') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'last30') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'thisMonth') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        start_date = d.toISOString().split('T')[0];
      }
      
      const data = await getDashboardSummary(start_date, end_date);
      setSummary(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              backendStatus === 'connected' ? 'bg-green-500' :
              backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">{backendMessage}</span>
          </div>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border rounded px-3 py-1 text-sm bg-white shadow-sm">
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
        </div>
      </div>

      {!summary ? (
        <div className="text-center py-10 text-gray-500">Loading Dashboard Analytics...</div>
      ) : (
        <>
          <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Factory Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Workers</h3>
              <div className="text-3xl font-bold text-blue-600">{summary.workers.total}</div>
              <div className="text-xs text-gray-500 mt-1">{summary.workers.present_today} Present Today ({summary.workers.attendance_percentage}%)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Machines Running</h3>
              <div className="text-3xl font-bold text-orange-600">{summary.machines.running} <span className="text-sm font-normal text-gray-500">/ {summary.machines.total}</span></div>
              <div className="text-xs text-red-500 mt-1 font-bold">{summary.machines.breakdown} in breakdown</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-purple-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Active Orders</h3>
              <div className="text-3xl font-bold text-purple-600">{summary.orders.active}</div>
              <div className="text-xs text-red-500 mt-1 font-bold">{summary.orders.overdue} overdue</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Active Production</h3>
              <div className="text-3xl font-bold text-green-600">{summary.production.active}</div>
              <div className="text-xs text-gray-500 mt-1">{summary.production.completion_percentage}% avg completion</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Workforce & Attendance Today</h3>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Present</span>
                <span className="font-bold text-green-600">{summary.workers.present_today}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Absent</span>
                <span className="font-bold text-red-600">{summary.workers.absent_today}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">On Leave</span>
                <span className="font-bold text-blue-600">{summary.workers.on_leave_today}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Half Day</span>
                <span className="font-bold text-orange-600">{summary.workers.half_day_today}</span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link to="/analytics" className="text-blue-600 text-sm font-bold hover:underline">View Analytics &rarr;</Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Production Pace (Selected Period)</h3>
              <div className="flex justify-between items-center mb-4">
                <div className="text-gray-600 text-sm">Produced</div>
                <div className="text-2xl font-bold text-green-600">{summary.production.today_produced}</div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-gray-600 text-sm">Rejected</div>
                <div className="text-2xl font-bold text-red-600">{summary.production.today_rejected}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-sm">Rejection Rate</div>
                <div className="text-lg font-bold text-gray-800">
                  {summary.production.today_produced > 0 ? ((summary.production.today_rejected / summary.production.today_produced) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link to="/reports" className="text-blue-600 text-sm font-bold hover:underline">Generate Reports &rarr;</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

