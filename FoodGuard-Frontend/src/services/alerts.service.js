import api from './api';
export const alertsService = {
  list:    ()   => api.get('/alerts').then(r => r.data?.alerts || r.data || []),
  dismiss: (id) => api.patch(`/alerts/${id}/dismiss`).then(r => r.data),
};
export default alertsService;
