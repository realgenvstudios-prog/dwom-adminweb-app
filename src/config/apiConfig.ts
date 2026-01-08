// API Configuration for Admin Dashboard

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dwom-backend.onrender.com';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
