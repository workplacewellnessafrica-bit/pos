import axios from 'axios';

// Get API URL from env or fallback
const BASE = import.meta.env.VITE_API_URL || 'https://dukapos-api.onrender.com/api/v1';

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// For POS, we assume the user is already authenticated (perhaps via an initial login screen)
// We'll use a simple interceptor to handle errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized access to POS API');
    }
    return Promise.reject(error);
  }
);

export default api;
