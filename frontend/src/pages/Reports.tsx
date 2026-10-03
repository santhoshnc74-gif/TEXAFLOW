import { useState } from 'react';
import { getFactorySummaryReport, exportCSV, exportPDF } from '../services/reportService';

export default function Reports() {
  const [reportType, setReportType] = useState('factory_summary');
  const [dateFilter, setDateFilter] = useState('last30');
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerate = async () => {
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

      if (reportType === 'factory_summary') {
        const res = await getFactorySummaryReport(start_date, end_date);
        setReportData(res);
      } else {
        alert("This specific report type is under development in this phase.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating report.");
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    if (reportType === 'factory_summary') {
      const dataToExport = Object.keys(reportData.summary).map(key => ({
        Metric: key,
        Value: reportData.summary[key]
      }));
      exportCSV(`Factory_Summary_${new Date().toISOString().split('T')[0]}`, dataToExport);
    }
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    if (reportType === 'factory_summary') {
      const columns = ['Metric', 'Value'];
      const dataToExport = Object.keys(reportData.summary).map(key => [
        key,
        reportData.summary[key].toString()
      ]);
      exportPDF('Factory Summary Report', columns, dataToExport);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Factory Reports</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full border rounded px-3 py-2 bg-gray-50">
              <option value="factory_summary">Factory Summary Report</option>
              <option value="attendance_report">Attendance Report</option>
              <option value="machine_downtime">Machine Downtime Report</option>
              <option value="production_daily">Daily Production Report</option>
              <option value="quality_report">Quality / Rejection Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date Range</label>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full border rounded px-3 py-2 bg-gray-50">
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
          <div>
            <button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow flex flex-col flex-1">
          <div className="px-6 py-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{reportData.report_type}</h2>
              <p className="text-xs text-gray-500">Date Range: {reportData.date_range} | Generated: {new Date(reportData.generated_at).toLocaleString()}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold shadow transition">Export CSV</button>
              <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold shadow transition">Export PDF</button>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {reportType === 'factory_summary' && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}


