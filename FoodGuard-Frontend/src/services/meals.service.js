import api from './api';
export const mealsService = {
  recommend: (params = {}) => api.post('/meals/recommend', params).then(r => r.data || {}),
  getMealPlan: ()          => api.get('/meals/meal-plan').then(r => r.data?.plan || null),
  generateMealPlan: (condition) =>
    api.post('/meals/meal-plan', condition ? { condition } : {}).then(r => r.data?.plan || null),
  recipe:    (id)          => api.get(`/meals/recipe/${id}`).then(r => r.data?.recipe || r.data),
  save:      (id)          => api.post(`/meals/saved/${id}`).then(r => r.data),
  upload:    (formData)    => api.post('/meals/upload', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              }).then(r => r.data),
};
export default mealsService;
