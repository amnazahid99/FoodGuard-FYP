import api from './api';

export const inventoryService = {
  list:   (params = {}) => api.get('/inventory', { params }).then(r => r.data?.items || r.data || []),
  create: (item)        => api.post('/inventory', item).then(r => r.data?.item || r.data),
  update: (id, data)    => api.put(`/inventory/${id}`, data).then(r => r.data?.item || r.data),
  remove: (id)          => api.delete(`/inventory/${id}`).then(r => r.data),

  // FEATURE 1 — receipt OCR: parse (no save), then bulk-save confirmed items
  scanReceipt: (formData) => api.post('/inventory/scan-receipt', formData, {
                               headers: { 'Content-Type': 'multipart/form-data' },
                             }).then(r => r.data?.items || []),
  bulkAdd: (items)        => api.post('/inventory/bulk', { items }).then(r => r.data?.items || []),

  // FEATURE 7 — weekly wastage report
  wastageReport: ()       => api.get('/inventory/wastage-report').then(r => r.data || {}),
};
export default inventoryService;
