import api from './api';
export const userService = {
  saveBmi: (data) => api.post('/user/bmi', data).then(r => r.data),       // FEATURE 6
  getBmi:  ()     => api.get('/user/bmi').then(r => r.data?.bmi || null),
};
export default userService;
