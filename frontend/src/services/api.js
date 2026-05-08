// API Service - Axios configuration

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('finova-auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  logout: () => api.post('/auth/logout')
};

export const userSettings = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export const accounts = {
  getAll: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  getSummary: () => api.get('/accounts/summary')
};

export const transactions = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  remove: (id) => api.delete(`/transactions/${id}`),
  categories: () => api.get('/transactions/categories'),
  summary: (params) => api.get('/transactions/summary', { params })
};

export const budgets = {
  getAll: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data)
};

export const exportsApi = {
  csvUrl: () => `${API_BASE_URL}/export/csv`,
  pdfUrl: () => `${API_BASE_URL}/export/pdf`
};

export const importsApi = {
  csv: (csv) => api.post('/import/csv', { csv })
};

export const receiptsApi = {
  analyze: (data) => api.post('/receipts/analyze', data),
  save: (data) => api.post('/receipts/save', data)
};

export const insightsApi = {
  getSmart: () => api.get('/insights')
};
