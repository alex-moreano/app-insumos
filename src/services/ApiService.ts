import axios, { AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Intentar obtener token desde localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.token = userData.token || null;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(useAuth: boolean = true): AxiosRequestConfig {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (useAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return { headers };
  }

  private handleError(error: unknown) {
    let message = 'Ha ocurrido un error en la comunicación con el servidor';

    if (axios.isAxiosError(error)) {
      console.error('Axios error config:', error.config);
      console.error('Axios error request:', error.request);

      if (error.response) {
        console.error('Axios error response:', error.response);
        message = error.response.data?.message || error.message || message;

        if (error.response.status === 401) {
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    toast.error(message);
  }

  async get<T>(url: string, useAuth: boolean = true): Promise<T> {
    try {
      const config = this.getHeaders(useAuth);
      const response = await axios.get<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(url: string, data: unknown, useAuth: boolean = true): Promise<T> {
    try {
      const config = this.getHeaders(useAuth);
      const response = await axios.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(url: string, data: unknown, useAuth: boolean = true): Promise<T> {
    try {
      const config = this.getHeaders(useAuth);
      const response = await axios.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(url: string, useAuth: boolean = true): Promise<T> {
    try {
      const config = this.getHeaders(useAuth);
      const response = await axios.delete<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService;
