import React, { useState } from 'react';
import { previewHistoricalFile, previewHistoricalUrl, confirmHistoricalImport, downloadHistoricalTemplate } from '../services/aiService';

interface ImportHistoricalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportHistoricalDataModal: React.FC<ImportHistoricalDataModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setActiveTab('file');
    setFile(null);
    setUrl('');
    setPreviewData(null);
    setImportResult(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleLoadPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'file') {
        if (!file) throw new Error("Please select a file");
        const res = await previewHistoricalFile(file);
        setPreviewData(res);
      } else {
        if (!url) throw new Error("Please enter a Google Sheets URL");
        const res = await previewHistoricalUrl(url);
        setPreviewData(res);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || !previewData.rows) return;
    const validRows = previewData.rows.filter((r: any) => r.is_valid);
    if (validRows.length === 0) {
      setError("No valid rows to import.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await confirmHistoricalImport(validRows);
      setImportResult({
        imported: res.imported,
        skipped: previewData.duplicate_records,
        errors: previewData.invalid_records
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Import Historical Production Data</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}
          
          {importResult ? (
            <div className="text-center py-10">
              <div className="text-green-600 text-5xl mb-4">?</div>
              <h3 className="text-2xl font-bold mb-4">Import Successful</h3>
              <p className="mb-6">{importResult.imported} production records imported successfully.</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-lg mb-8">
                <div className="text-green-600"><strong>Imported:</strong> {importResult.imported}</div>
                <div className="text-orange-500"><strong>Skipped Duplicate:</strong> {importResult.skipped}</div>
                <div className="text-red-600"><strong>Skipped Invalid:</strong> {importResult.errors}</div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={handleClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded shadow w-full sm:w-auto">
                  Close
                </button>
              </div>
            </div>
          ) : previewData ? (
            <div>
              <div className="flex flex-col sm:flex-row justify-between mb-4">
                <h3 className="font-bold text-lg">Preview Data</h3>
                <div className="flex gap-4 text-sm font-semibold">
                  <span className="text-gray-600">Total: {previewData.total_records}</span>
                  <span className="text-green-600">Valid: {previewData.valid_records}</span>
                  <span className="text-red-600">Invalid: {previewData.invalid_records}</span>
                  <span className="text-orange-500">Duplicates: {previewData.duplicate_records}</span>
                </div>
              </div>
              
              <div className="overflow-x-auto border rounded mb-6">
                <table className="min-w-max w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2">Status</th>
                      <th className="p-2">Code</th>
                      <th className="p-2">Order ID</th>
                      <th className="p-2">Tgt Qty</th>
                      <th className="p-2">Comp Qty</th>
                      <th className="p-2">Planned Start</th>
                      <th className="p-2">Planned End</th>
                      <th className="p-2">Actual Start</th>
                      <th className="p-2">Actual End</th>
                      <th className="p-2">Validation Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.rows.slice(0, 15).map((row: any, i: number) => (
                      <tr key={i} className={row.is_valid ? 'bg-white' : 'bg-red-50'}>
                        <td className="p-2">
                          {row.is_valid ? 
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Valid</span> : 
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Invalid</span>
                          }
                        </td>
                        <td className="p-2 font-mono">{row.production_code}</td>
                        <td className="p-2">{row.order_id}</td>
                        <td className="p-2">{row.target_quantity}</td>
                        <td className="p-2">{row.completed_quantity}</td>
                        <td className="p-2">{row.planned_start_date}</td>
                        <td className="p-2">{row.planned_end_date}</td>
                        <td className="p-2">{row.actual_start_date || '-'}</td>
                        <td className="p-2">{row.actual_end_date || '-'}</td>
                        <td className="p-2 text-red-600 text-xs">{row.validation_error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.rows.length > 15 && (
                  <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                    Showing first 15 of {previewData.rows.length} rows...
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button onClick={() => setPreviewData(null)} disabled={loading} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded shadow disabled:opacity-50 w-full sm:w-auto">
                  Back
                </button>
                <button onClick={handleImport} disabled={loading || previewData.valid_records === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow disabled:opacity-50 w-full sm:w-auto">
                  {loading ? 'Importing...' : `Import ${previewData.valid_records} Valid Records`}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b mb-6">
                <button 
                  className={`py-2 px-6 font-medium ${activeTab === 'file' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('file')}
                >
                  Excel / CSV
                </button>
                <button 
                  className={`py-2 px-6 font-medium ${activeTab === 'url' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('url')}
                >
                  Google Sheets
                </button>
              </div>

              {/* Input Area */}
              <div className="mb-6">
                {activeTab === 'file' ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="block w-full max-w-sm mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    <p className="mt-2 text-sm text-gray-500">Drag & drop your Excel or CSV file here or click to browse</p>
                    <p className="mt-1 text-xs text-gray-400">Recommended max size: 10 MB</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet URL</label>
                    <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/... (Must be 'Anyone with the link can view')" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-start mb-6">
                <button type="button" onClick={downloadHistoricalTemplate} className="text-blue-600 hover:text-blue-800 font-medium underline text-sm">
                  Download Excel Template
                </button>
              </div>

              <div className="flex justify-end">
                <button onClick={handleLoadPreview} disabled={loading || (activeTab === 'file' ? !file : !url)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow disabled:opacity-50 w-full sm:w-auto">
                  {loading ? 'Reading Data...' : (activeTab === 'file' ? 'Read Data' : 'Load Sheet')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportHistoricalDataModal;
