import api from './api';
export const settingsService = {
  getProfile:      ()      => api.get('/settings/profile').then(r => r.data?.profile || r.data),
  updateProfile:   (data)  => api.put('/settings/profile', data).then(r => r.data),
  updatePassword:  (data)  => api.put('/settings/password', data).then(r => r.data),
  getPreferences:  ()      => api.get('/settings/preferences').then(r => r.data?.preferences || r.data),
  updatePreferences:(data) => api.put('/settings/preferences', data).then(r => r.data),
  updateNotifications:(data)=> api.put('/settings/notifications', data).then(r => r.data),
  deleteAccount:   ()      => api.delete('/settings/account').then(r => r.data),
  getHealthProfile: ()     => api.get('/settings/health-profile').then(r => r.data),
  updateHealthProfile:(data)=> api.put('/settings/health-profile', data).then(r => r.data),
  submitContact:   (data)  => api.post('/contact', data).then(r => r.data),
  notifications:   ()      => api.get('/notifications').then(r => r.data?.notifications || r.data || []),
  dismissNotification:(id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  clearNotifications:()    => api.delete('/notifications').then(r => r.data),
};
export default settingsService;
