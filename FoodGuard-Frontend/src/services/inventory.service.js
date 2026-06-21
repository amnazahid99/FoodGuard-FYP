import api from './api';

function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Image processing failed'));
            const processed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(processed);
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const inventoryService = {
  list:   (params = {}) => api.get('/inventory', { params }).then(r => r.data?.items || r.data || []),
  create: (item)        => api.post('/inventory', item).then(r => r.data?.item || r.data),
  update: (id, data)    => api.put(`/inventory/${id}`, data).then(r => r.data?.item || r.data),
  consume: (id)         => api.patch(`/inventory/${id}/consume`).then(r => r.data?.item || r.data),
  remove: (id)          => api.delete(`/inventory/${id}`).then(r => r.data),

  // FEATURE 1 — receipt OCR: parse (no save), then bulk-save confirmed items
  scanReceipt: (formData) => api.post('/inventory/scan-receipt', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              }).then((r) => r.data?.items || []),
  bulkAdd: (items)        => api.post('/inventory/bulk', { items }).then(r => r.data?.items || []),

  // FEATURE 7 — weekly wastage report
  wastageReport: ()       => api.get('/inventory/wastage-report').then(r => r.data || {}),
};

export { preprocessImage };
export default inventoryService;
