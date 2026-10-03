import { useState, useEffect } from 'react';
import { getWorkforceAnalytics, getMachineAnalytics, getOrderAnalytics, getProductionAnalytics } from '../services/dashboardService';
import { getAIStatus } from '../services/aiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300'];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('workforce');
  const [dateFilter, setDateFilter] = useState('last30');
  const [loading, setLoading] = useState(false);
  
  const [workforce, setWorkforce] = useState<any>(null);
  const [machines, setMachines] = useState<any>(null);
  const [orders, setOrders] = useState<any>(null);
  const [production, setProduction] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let start_date = '';
      let end_date = today.toISOString().split('T')[0];
      
      if (dateFilter === 'last7') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'last30') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'thisMonth') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'thisYear') {
        const d = new Date(today.getFullYear(), 0, 1);
        start_date = d.toISOString().split('T')[0];
      }
      
      if (activeTab === 'workforce') {
        setWorkforce(await getWorkforceAnalytics(start_date, end_date));
      } else if (activeTab === 'machines') {
        setMachines(await getMachineAnalytics(start_date, end_date));
      } else if (activeTab === 'orders') {
        setOrders(await getOrderAnalytics(start_date, end_date));
      } else if (activeTab === 'production') {
        setProduction(await getProductionAnalytics(start_date, end_date));
      } else if (activeTab === 'ai') {
        setAiStatus(await getAIStatus());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <div className="flex flex-col"><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Factory Analytics</h1><p className="text-sm text-slate-500 mt-1">Visual data summaries and performance.</p></div>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border rounded px-3 py-1 text-sm bg-white shadow-sm">
          <option value="last7">Last 7 Days</option>
          <option value="last30">Last 30 Days</option>
          <option value="thisMonth">This Month</option>
          <option value="thisYear">This Year</option>
        </select>
      </div>
      
      <div className="flex border-b mb-6">
        {['workforce', 'machines', 'orders', 'production', 'ai'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading Analytics...</div>
      ) : (
        <div className="flex-1">
          {activeTab === 'workforce' && workforce && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold mb-4">Attendance Trend</h3>
                <div className="h-64">
                  {workforce.attendance_trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={workforce.attendance_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Present" stroke="#10B981" />
                        <Line type="monotone" dataKey="Absent" stroke="#EF4444" />
                        <Line type="monotone" dataKey="On Leave" stroke="#3B82F6" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <div className="text-slate-500 text-center py-10">No data available.</div>}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold mb-4">Workers by Department</h3>
                <div className="h-64">
                  {workforce.department_breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={workforce.department_breakdown} dataKey="count" nameKey="department" cx="50%" cy="50%" outerRadius={80} label>
                          {workforce.department_breakdown.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="text-slate-500 text-center py-10">No data available.</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'machines' && machines && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold mb-4">Machine Status Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={machines.status_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold mb-4">Machine Downtime (Minutes)</h3>
                <div className="text-3xl font-bold text-red-600 mb-4">{machines.total_downtime_minutes} mins</div>
                <h4 className="text-sm font-semibold text-slate-600 mb-2">Top 5 Machines by Downtime</h4>
                <ul className="divide-y">
                  {machines.top_downtime_machines.map((m: any, i: number) => (
                    <li key={i} className="py-2 flex justify-between">
                      <span className="font-semibold">{m.machine_code}</span>
                      <span className="text-red-500 font-bold">{m.downtime_minutes} mins</span>
                    </li>
                  ))}
                  {machines.top_downtime_machines.length === 0 && <li className="text-slate-500">No downtime recorded in this period.</li>}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'orders' && orders && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold mb-4">Order Status Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orders.status_breakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                        {orders.status_breakdown.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold mb-4">Delivery Performance</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded text-center">
                    <div className="text-3xl font-bold text-green-600">{orders.delivery_performance.on_time}</div>
                    <div className="text-sm font-semibold text-green-800">Delivered On Time</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded text-center">
                    <div className="text-3xl font-bold text-red-600">{orders.delivery_performance.late}</div>
                    <div className="text-sm font-semibold text-red-800">Delivered Late</div>
                  </div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-sm text-slate-500">Average Delay</div>
                  <div className="text-2xl font-bold">{orders.delivery_performance.avg_delay_days} days</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'production' && production && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200 md:col-span-2">
                <h3 className="font-bold mb-4">Daily Production Trend</h3>
                <div className="h-64">
                  {production.daily_trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={production.daily_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="produced" fill="#10B981" name="Produced" />
                        <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-slate-500 text-center py-10">No data available.</div>}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200 md:col-span-2">
                <h3 className="font-bold mb-4 flex justify-between">
                  <span>Department Performance</span>
                  <span className="text-red-600 text-sm">Overall Rejection Rate: {production.overall_rejection_rate}%</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-max w-full text-left text-sm border">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2">Department</th>
                        <th className="p-2">Target</th>
                        <th className="p-2">Completed</th>
                        <th className="p-2">Progress %</th>
                        <th className="p-2">Rejected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {production.department_performance.map((d: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2 font-semibold">{d.department}</td>
                          <td className="p-2">{d.target}</td>
                          <td className="p-2 text-green-600 font-bold">{d.completed}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 h-2 rounded"><div className="bg-blue-500 h-2 rounded" style={{width: `${d.completion_pct}%`}}></div></div>
                              <span>{d.completion_pct}%</span>
                            </div>
                          </td>
                          <td className="p-2 text-red-600">{d.rejected}</td>
                        </tr>
                      ))}
                      {production.department_performance.length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">No data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && aiStatus && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200 max-w-2xl mx-auto text-center mt-10">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-2">AI Prediction Engine Status</h3>
              <p className="text-slate-600 mb-6">The AI engine is currently operating in <strong className="text-purple-600 uppercase">{aiStatus.prediction_mode}</strong> mode.</p>
              
              <div className="grid grid-cols-2 gap-4 text-left border-t pt-4">
                <div>
                  <div className="text-sm text-slate-500">Model Version</div>
                  <div className="font-bold">{aiStatus.model_version || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Training Records</div>
                  <div className="font-bold">{aiStatus.training_records}</div>
                </div>
                {aiStatus.trained_at && (
                  <div className="col-span-2">
                    <div className="text-sm text-slate-500">Last Trained At</div>
                    <div className="font-bold">{new Date(aiStatus.trained_at).toLocaleString()}</div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 text-sm text-slate-500">
                To view actionable AI Insights and risk alerts, see the <a href="/ai-predictions" className="text-blue-500 hover:underline">AI Predictions Dashboard</a>.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
