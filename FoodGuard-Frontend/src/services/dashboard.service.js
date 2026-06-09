import api from './api';
export const dashboardService = {
  overview: () => api.get('/dashboard').then(r => r.data || {}),
};
export default dashboardService;
