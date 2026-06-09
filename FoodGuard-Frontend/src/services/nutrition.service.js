import api from './api';
export const nutritionService = {
  // Accepts an array of items ([{name, quantity_grams}] or [string]) or a single string
  analyze: (foodItems) =>
    api.post('/nutrition/analyze', Array.isArray(foodItems) ? { foodItems } : { foodItem: foodItems })
       .then(r => r.data?.log || r.data),
  today:  () => api.get('/nutrition/today').then(r => r.data?.log || null),
  report: () => api.get('/nutrition/report').then(r => r.data),
};
export default nutritionService;
