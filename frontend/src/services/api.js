import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject x-company-id
api.interceptors.request.use(
  (config) => {
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    if (activeCompanyId) {
      config.headers['x-company-id'] = activeCompanyId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for unified error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
