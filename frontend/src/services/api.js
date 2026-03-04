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

// ==================== prediction API ====================
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
};

// ==================== PLAYER COMPARISON API ====================
export const comparisonAPI = {
  // Search players by name
  searchPlayers: (searchTerm, limit = 50) =>
    api.get('/api/players', { params: { search: searchTerm, limit } }),

  // Get player details by ID
  getPlayerDetails: (playerId) =>
    api.get(`/api/player/${playerId}`),

  // Compare multiple players
  comparePlayers: (playerIds) =>
    api.post('/api/player-comparison', playerIds),

  // Get all players (with optional filters)
  getAllPlayers: (limit = 100) =>
    api.get('/api/players', { params: { limit } }),

  // Get players by position
  getPlayersByPosition: (position, limit = 50) =>
    api.get('/api/players', { params: { position, limit } }),
};

// ==================== UTILITY API ====================
export const utilityAPI = {
  // Get all positions from CSV
  getPositions: () => api.get('/api/positions'),

  // Get feature importance
  getFeatureImportance: () => api.get('/api/feature-importance'),

  // Download player data as JSON
  exportPlayerData: (playerIds) =>
    api.post('/api/export-players', playerIds, { responseType: 'blob' }),
};

export default api;