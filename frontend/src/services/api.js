import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add loading indicator if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const predictionAPI = {
  // Health check
  healthCheck: () => api.get('/api/health'),
  
  // Get model statistics
  getStats: () => api.get('/api/stats'),
  
  // Get feature lists
  getFeatures: () => api.get('/api/features'),
  
  // Get sample players
  getSamples: () => api.get('/api/samples'),
  
  // Predict single player
  predict: (playerData) => api.post('/api/predict', playerData),
  
  // Bulk predict
  bulkPredict: (players) => api.post('/api/bulk-predict', { players }),
};

export default api;