import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - only redirect to login if we're not on a public page
      if (typeof window !== 'undefined') {
        const publicPaths = ['/posts', '/login', '/register', '/'];
        const currentPath = window.location.pathname;
        const isPublicPage = publicPaths.some(path => currentPath.startsWith(path));
        
        // Only redirect if not on a public page and token exists (user was logged in)
        const hadToken = localStorage.getItem('auth_token');
        if (hadToken && !isPublicPage) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        } else if (!isPublicPage) {
          // No token but trying to access protected resource
          window.location.href = '/login';
        }
        // If on public page, just clear token but don't redirect
        else if (hadToken) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('refresh_token');
        }
      }
    }
    
    // Return the original error for proper handling
    return Promise.reject(error);
  }
);

export default api;
