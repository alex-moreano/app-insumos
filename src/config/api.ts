// API Configuration
const API_BASE_URL = "http://localhost:5000/api";
export const API_URL = "http://localhost:5000/api";

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/users/login`,
  register: `${API_BASE_URL}/users/register`,
  profile: `${API_BASE_URL}/users/profile`,
  
  // Resources
  products: `${API_BASE_URL}/products`,
  warehouses: `${API_BASE_URL}/warehouses`,
  suppliers: `${API_BASE_URL}/suppliers`,
  movements: `${API_BASE_URL}/movements`,
  kardex: `${API_BASE_URL}/kardex`,
  reports: `${API_BASE_URL}/reports`,
};

// Helper to include auth token in requests
export const authHeader = (token: string) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
};