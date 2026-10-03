import os

path = 'frontend/src/services/aiService.ts'
with open(path, 'r') as f:
    content = f.read()
    
content = content.replace("export const downloadHistoricalTemplate = () => {\n  window.open(${api.defaults.baseURL || ''}/api/ai/import/template, '_blank');\n};", """export const downloadHistoricalTemplate = async () => {
  const response = await api.get('/api/ai/import/template', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'texflow_historical_production_template.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
};""")

with open(path, 'w') as f:
    f.write(content)
