import axios from 'axios';
import { API_URL } from '../config/api';

// Types for reports
export interface MovementReport {
  _id: string;
  type: string;
  productId: string;
  productName: string;
  quantity: number;
  date: string;
  supplier?: string;
  warehouse?: string;
  createdBy: string;
}

export interface KardexEntry {
  date: string;
  type: string;
  description: string;
  input: number;
  output: number;
  balance: number;
  unitPrice?: number;
  totalValue?: number;
}

export interface KardexReport {
  product: {
    id: string;
    name: string;
    code: string;
    category?: string;
    unit: string;
  };
  entries: KardexEntry[];
}

// Report Service
class ReportService {
  // Get movement reports with optional filters
  async getMovements(token: string, filters: {
    startDate?: string,
    endDate?: string,
    type?: string,
    productId?: string,
    warehouseId?: string
  } = {}) {
    try {
      const response = await axios.get(`${API_URL}/api/reports/movements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching movement reports:", error);
      throw error;
    }
  }

  // Get kardex report for a specific product
  async getKardex(token: string, productId: string, startDate?: string, endDate?: string) {
    try {
      const response = await axios.get(`${API_URL}/api/reports/kardex/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching kardex report:", error);
      throw error;
    }
  }

  // Get stock reports with optional filters
  async getStockReport(token: string, filters: {
    warehouseId?: string,
    categoryId?: string
  } = {}) {
    try {
      const response = await axios.get(`${API_URL}/api/reports/stock`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching stock report:", error);
      throw error;
    }
  }
}

export const reportService = new ReportService();