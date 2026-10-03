import React, { useState } from 'react';
import { previewWorkersFile, previewWorkersUrl, confirmImportWorkers } from '../services/workerService';

interface ImportWorkersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportWorkersModal: React.FC<ImportWorkersModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
        const res = await previewWorkersFile(file);
        setPreviewData(res);
      } else {
        if (!url) throw new Error("Please enter a Google Sheets URL");
        const res = await previewWorkersUrl(url);
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
    const validRows = previewData.rows.filter((r: any) => r.validation_status === 'Valid');
    if (validRows.length === 0) {
      setError("No valid rows to import.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await confirmImportWorkers(validRows);
      setImportResult({
        imported: res.imported_count,
        skipped: previewData.duplicate_count,
        errors: previewData.invalid_count
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Import Workers</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}
          
          {importResult ? (
            <div className="text-center py-10">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h3 className="text-2xl font-bold mb-4">Import Complete</h3>
              <div className="flex justify-center space-x-8 text-lg">
                <div className="text-green-600"><strong>Imported:</strong> {importResult.imported}</div>
                <div className="text-orange-500"><strong>Skipped:</strong> {importResult.skipped}</div>
                <div className="text-red-600"><strong>Errors:</strong> {importResult.errors}</div>
              </div>
            </div>
          ) : !previewData ? (
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
                    <p className="mt-2 text-sm text-gray-500">Supports .xlsx, .xls, .csv</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet URL</label>
                    <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/... (Must be 'Anyone with the link can view')" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={handleLoadPreview} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow disabled:opacity-50">
                  {loading ? 'Reading Data...' : (activeTab === 'file' ? 'Read Data' : 'Load Sheet')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Preview Stats */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6 border">
                <div className="font-bold text-gray-700">Total Rows: {previewData.total}</div>
                <div className="flex space-x-6">
                  <div className="text-green-600 font-semibold">Valid: {previewData.valid_count}</div>
                  <div className="text-orange-500 font-semibold">Duplicates: {previewData.duplicate_count}</div>
                  <div className="text-red-600 font-semibold">Invalid: {previewData.invalid_count}</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.rows.map((row: any, i: number) => {
                      let bgColor = '';
                      let statusText = row.validation_status;
                      if (row.validation_status === 'Valid') bgColor = 'bg-green-50 text-green-800';
                      else if (row.validation_status === 'Invalid') bgColor = 'bg-red-50 text-red-800';
                      else if (row.validation_status === 'Duplicate') bgColor = 'bg-orange-50 text-orange-800';

                      return (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${bgColor}`}>
                              {statusText}
                            </span>
                            {row.validation_errors && row.validation_errors.length > 0 && (
                              <div className="text-xs text-red-500 mt-1">{row.validation_errors.join(', ')}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.employee_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.designation}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.shift}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
          {!importResult && (
            <button onClick={handleClose} className="px-6 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 font-medium">Cancel</button>
          )}
          
          {importResult ? (
            <button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow">Done</button>
          ) : previewData ? (
            <button 
              onClick={handleImport} 
              disabled={loading || previewData.valid_count === 0} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Valid Workers'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ImportWorkersModal;
