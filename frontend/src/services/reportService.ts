import api from './api';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const getFactorySummaryReport = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const response = await api.get(`/api/reports/factory-summary?${params.toString()}`);
  return response.data;
};

export const exportCSV = (filename: string, data: any[]) => {
  if (!data || data.length === 0) return;
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPDF = (title: string, columns: string[], data: any[][]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('TEXFLOW - ' + title, 14, 22);
  doc.setFontSize(11);
  doc.text('Generated at: ' + new Date().toLocaleString(), 14, 30);
  
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: data,
  });
  
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};
