import React, { useState } from 'react';
import { 
  getFactorySummaryReport, 
  getAttendanceReport, 
  getWorkerReport, 
  getProductionReport, 
  getMachineReport, 
  getOrderReport, 
  getCustomerReport, 
  exportCSV, 
  exportPDF 
} from '../services/reportService';

export default function Reports() {
  const [reportType, setReportType] = useState('factory_summary');
  const [dateFilter, setDateFilter] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      let start_date = '';
      let end_date = today.toISOString().split('T')[0];
      
      if (dateFilter === 'today') {
        start_date = today.toISOString().split('T')[0];
      } else if (dateFilter === 'last7') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'last30') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'thisMonth') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        start_date = d.toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        if (!customStart || !customEnd) {
           setError('Please select both From and To dates for custom range.');
           setLoading(false);
           return;
        }
        if (customStart > customEnd) {
           setError('From Date must be before or equal to To Date.');
           setLoading(false);
           return;
        }
        start_date = customStart;
        end_date = customEnd;
      }

      let res;
      switch (reportType) {
        case 'factory_summary': res = await getFactorySummaryReport(start_date, end_date); break;
        case 'attendance': res = await getAttendanceReport(start_date, end_date); break;
        case 'workers': res = await getWorkerReport(start_date, end_date); break;
        case 'production': res = await getProductionReport(start_date, end_date); break;
        case 'machines': res = await getMachineReport(start_date, end_date); break;
        case 'orders': res = await getOrderReport(start_date, end_date); break;
        case 'customers': res = await getCustomerReport(start_date, end_date); break;
        default: 
           throw new Error("Invalid report type");
      }
      setReportData(res);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || 'Failed to load report.');
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const filename = \	exflow_\_\\;
    if (reportType === 'factory_summary') {
      const dataToExport = Object.keys(reportData.summary || {}).map(key => ({
        Metric: key,
        Value: reportData.summary[key]
      }));
      exportCSV(filename, dataToExport);
    } else {
      exportCSV(filename, reportData.data);
    }
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    if (reportType === 'factory_summary') {
      const dataToExport = Object.keys(reportData.summary || {}).map(key => ({
        Metric: key,
        Value: reportData.summary[key]?.toString() || '-'
      }));
      exportPDF(reportData.report_type, null, dataToExport, reportData.date_range);
    } else {
      exportPDF(reportData.report_type, reportData.summary, reportData.data, reportData.date_range);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Factory Reports</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Report Type</label>
            <select value={reportType} onChange={e => { setReportType(e.target.value); setReportData(null); }} className="w-full border rounded px-3 py-2 bg-gray-50">
              <option value="factory_summary">Factory Summary</option>
              <option value="attendance">Attendance Report</option>
              <option value="workers">Worker Report</option>
              <option value="production">Production Report</option>
              <option value="machines">Machine Report</option>
              <option value="orders">Order Report</option>
              <option value="customers">Customer Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date Range</label>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full border rounded px-3 py-2 bg-gray-50">
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'custom' ? (
            <div className="col-span-1 sm:col-span-2 md:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">From</label>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full border rounded px-3 py-2 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">To</label>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full border rounded px-3 py-2 bg-gray-50" />
              </div>
            </div>
          ) : (
            <div className="hidden md:block col-span-1"></div>
          )}

          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{reportData.report_type}</h2>
              <p className="text-xs text-gray-500">Date Range: {reportData.date_range} | Generated: {new Date(reportData.generated_at).toLocaleString()}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={handleExportCSV} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold shadow transition">Export CSV</button>
              <button onClick={handleExportPDF} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold shadow transition">Export PDF</button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {/* Summary Cards */}
            {reportData.summary && Object.keys(reportData.summary).length > 0 && reportType !== 'factory_summary' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                 {Object.entries(reportData.summary).map(([key, value]) => (
                   <div key={key} className="bg-blue-50 rounded p-3 border border-blue-100 shadow-sm">
                     <div className="text-xs text-gray-500 font-semibold mb-1">{key}</div>
                     <div className="text-lg sm:text-xl font-bold text-gray-800">{value as any}</div>
                   </div>
                 ))}
              </div>
            )}

            {/* Main Content */}
            {reportType === 'factory_summary' ? (
              <div className="max-w-2xl mx-auto overflow-x-auto">
                <table className="min-w-max w-full border text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border-b">Metric</th>
                      <th className="p-3 border-b text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.keys(reportData.summary).map(key => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-700">{key}</td>
                        <td className="p-3 text-right font-bold text-gray-900">{reportData.summary[key]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded">
                {!reportData.data || reportData.data.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-semibold">No records found for selected date range.</div>
                ) : (
                  <table className="min-w-max w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        {Object.keys(reportData.data[0]).map(col => (
                          <th key={col} className="p-3 font-semibold text-gray-700">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.data.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.keys(reportData.data[0]).map(col => (
                            <td key={col} className="p-3 text-gray-600">{row[col] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
