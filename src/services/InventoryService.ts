import { 
  Product, 
  Warehouse, 
  Supplier, 
  Movement, 
  KardexEntry, 
  StockSummary 
} from "@/types/inventory";
import { StockReportItem, MovementReportItem, RotationReportItem } from "@/types/reports";
import apiService from "./ApiService";
import { API_ENDPOINTS } from "@/config/api";

// Sample data for initial load or when API is not available
const initialProducts: Product[] = [
  {
    id: "p1",
    code: "PROD001",
    name: "Monitor LED 24 pulgadas",
    category: "Electrónica",
    unit: "Unidad",
    currentStock: 45,
    createdBy: "admin",
    createdAt: "2025-07-01T10:00:00Z"
  },
  {
    id: "p2",
    code: "PROD002",
    name: "Teclado mecánico",
    category: "Electrónica",
    unit: "Unidad",
    currentStock: 65,
    createdBy: "admin",
    createdAt: "2025-07-01T11:00:00Z"
  },
  {
    id: "p3",
    code: "PROD003",
    name: "Papel A4 (resma)",
    category: "Oficina",
    unit: "Paquete",
    currentStock: 120,
    createdBy: "admin",
    createdAt: "2025-07-02T09:00:00Z"
  }
];

const initialWarehouses: Warehouse[] = [
  {
    id: "w1",
    name: "Almacén Principal",
    location: "Quito",
    description: "Almacén central de la empresa",
    isActive: true
  },
  {
    id: "w2",
    name: "Sucursal Sur",
    location: "Guayaquil",
    description: "Almacén de sucursal",
    isActive: true
  }
];

const initialSuppliers: Supplier[] = [
  {
    id: "s1",
    name: "TechSupplies",
    contactPerson: "Juan Pérez",
    phone: "0987654321",
    email: "info@techsupplies.com",
    address: "Av. Principal 123",
    isActive: true
  },
  {
    id: "s2",
    name: "Office Solutions",
    contactPerson: "María López",
    phone: "0998765432",
    email: "ventas@officesolutions.com",
    address: "Calle Comercial 456",
    isActive: true
  }
];

// Local storage to keep mock data
const mockProducts = [...initialProducts];
const mockWarehouses = [...initialWarehouses];
const mockSuppliers = [...initialSuppliers];
const mockMovements: Movement[] = [];
const mockKardex: KardexEntry[] = [];

class InventoryService {
  private isBackendAvailable: boolean = false;

  constructor() {
    this.checkBackendAvailability();
  }

  private async checkBackendAvailability(): Promise<void> {
    try {
      await fetch(`${API_ENDPOINTS.products}`, { method: 'HEAD' });
      this.isBackendAvailable = true;
      console.log("Backend API is available");
    } catch (error) {
      console.warn("Backend API not available, using mock data", error);
      this.isBackendAvailable = false;
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.get<Product[]>(API_ENDPOINTS.products);
      } catch (error) {
        console.error("Error fetching products from API, using mock data", error);
      }
    }
    return [...mockProducts];
  }

  async getProduct(id: string): Promise<Product | null> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.get<Product>(`${API_ENDPOINTS.products}/${id}`);
      } catch (error) {
        console.error(`Error fetching product ${id} from API, using mock data`, error);
      }
    }
    return mockProducts.find(p => p.id === id) || null;
  }

  async createProduct(productData: Omit<Product, "id" | "createdAt" | "createdBy">): Promise<Product> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const createdBy = user.fullName || 'Usuario';
    
    const newProduct = {
      ...productData,
      id: "",
      createdBy,
      createdAt: new Date().toISOString()
    };

    if (this.isBackendAvailable) {
      try {
        return await apiService.post<Product>(API_ENDPOINTS.products, newProduct);
      } catch (error) {
        console.error("Error creating product via API, using mock data", error);
      }
    }
    
    // Mock implementation
    const mockProduct = {
      ...newProduct,
      id: `p${mockProducts.length + 1}`
    };
    mockProducts.push(mockProduct);
    return mockProduct;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.put<Product>(`${API_ENDPOINTS.products}/${id}`, productData);
      } catch (error) {
        console.error(`Error updating product ${id} via API, using mock data`, error);
      }
    }
    
    // Mock implementation
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedBy = user.fullName || 'Usuario';
    
    mockProducts[index] = {
      ...mockProducts[index],
      ...productData,
      updatedBy,
      updatedAt: new Date().toISOString()
    };
    
    return mockProducts[index];
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (this.isBackendAvailable) {
      try {
        await apiService.delete(`${API_ENDPOINTS.products}/${id}`);
        return true;
      } catch (error) {
        console.error(`Error deleting product ${id} via API, using mock data`, error);
      }
    }
    
    // Mock implementation
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    mockProducts.splice(index, 1);
    return true;
  }

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.get<Warehouse[]>(API_ENDPOINTS.warehouses);
      } catch (error) {
        console.error("Error fetching warehouses from API, using mock data", error);
      }
    }
    return [...mockWarehouses];
  }

  async getWarehouse(id: string): Promise<Warehouse | null> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.get<Warehouse>(`${API_ENDPOINTS.warehouses}/${id}`);
      } catch (error) {
        console.error(`Error fetching warehouse ${id} from API, using mock data`, error);
      }
    }
    return mockWarehouses.find(w => w.id === id) || null;
  }

  async createWarehouse(warehouseData: Omit<Warehouse, "id">): Promise<Warehouse> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.post<Warehouse>(API_ENDPOINTS.warehouses, warehouseData);
      } catch (error) {
        console.error("Error creating warehouse via API, using mock data", error);
      }
    }
    
    // Mock implementation
    const mockWarehouse = {
      ...warehouseData,
      id: `w${mockWarehouses.length + 1}`
    };
    mockWarehouses.push(mockWarehouse);
    return mockWarehouse;
  }

  async updateWarehouse(id: string, warehouseData: Partial<Warehouse>): Promise<Warehouse | null> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.put<Warehouse>(`${API_ENDPOINTS.warehouses}/${id}`, warehouseData);
      } catch (error) {
        console.error(`Error updating warehouse ${id} via API, using mock data`, error);
      }
    }
    
    // Mock implementation
    const index = mockWarehouses.findIndex(w => w.id === id);
    if (index === -1) return null;
    
    mockWarehouses[index] = {
      ...mockWarehouses[index],
      ...warehouseData
    };
    
    return mockWarehouses[index];
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.get<Supplier[]>(API_ENDPOINTS.suppliers);
      } catch (error) {
        console.error("Error fetching suppliers from API, using mock data", error);
      }
    }
    return [...mockSuppliers];
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.get<Supplier>(`${API_ENDPOINTS.suppliers}/${id}`);
      } catch (error) {
        console.error(`Error fetching supplier ${id} from API, using mock data`, error);
      }
    }
    return mockSuppliers.find(s => s.id === id) || null;
  }

  async createSupplier(supplierData: Omit<Supplier, "id">): Promise<Supplier> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.post<Supplier>(API_ENDPOINTS.suppliers, supplierData);
      } catch (error) {
        console.error("Error creating supplier via API, using mock data", error);
      }
    }
    
    // Mock implementation
    const mockSupplier = {
      ...supplierData,
      id: `s${mockSuppliers.length + 1}`
    };
    mockSuppliers.push(mockSupplier);
    return mockSupplier;
  }

  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.put<Supplier>(`${API_ENDPOINTS.suppliers}/${id}`, supplierData);
      } catch (error) {
        console.error(`Error updating supplier ${id} via API, using mock data`, error);
      }
    }
    
    // Mock implementation
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...supplierData
    };
    
    return mockSuppliers[index];
  }

  // Movements
  async getMovements(type?: string): Promise<Movement[]> {
    if (this.isBackendAvailable) {
      try {
        const url = type 
          ? `${API_ENDPOINTS.movements}?type=${type}` 
          : API_ENDPOINTS.movements;
        return await apiService.get<Movement[]>(url);
      } catch (error) {
        console.error("Error fetching movements from API, using mock data", error);
      }
    }
    
    return type 
      ? mockMovements.filter(m => m.type === type)
      : [...mockMovements];
  }

  async getMovement(id: string): Promise<Movement | null> {
    if (this.isBackendAvailable) {
      try {
        return await apiService.get<Movement>(`${API_ENDPOINTS.movements}/${id}`);
      } catch (error) {
        console.error(`Error fetching movement ${id} from API, using mock data`, error);
      }
    }
    return mockMovements.find(m => m.id === id) || null;
  }

  async createIncomingMovement(movementData: Partial<Movement>): Promise<Movement> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const createdBy = user.fullName || 'Usuario';
    const now = new Date().toISOString();
    
    const newMovement = {
      ...movementData,
      id: "",
      type: "ingreso",
      date: movementData.date || now,
      createdBy,
      createdAt: now,
      status: "active"
    } as Movement;

    if (this.isBackendAvailable) {
      try {
        return await apiService.post<Movement>(`${API_ENDPOINTS.movements}/incoming`, newMovement);
      } catch (error) {
        console.error("Error creating incoming movement via API, using mock data", error);
      }
    }
    
    // Mock implementation
    const mockMovement = {
      ...newMovement,
      id: `m${mockMovements.length + 1}`
    };
    mockMovements.push(mockMovement);
    
    // Update product stock in mock data
    mockMovement.lines.forEach(line => {
      const product = mockProducts.find(p => p.id === line.productId);
      if (product) {
        product.currentStock += line.quantity;
      }
    });
    
    // Create kardex entries
    mockMovement.lines.forEach(line => {
      const product = mockProducts.find(p => p.id === line.productId);
      if (product) {
        mockKardex.push({
          id: `k${mockKardex.length + 1}`,
          date: mockMovement.date,
          movementId: mockMovement.id,
          type: "ingreso",
          productId: line.productId,
          warehouseId: mockMovement.warehouseId,
          quantity: line.quantity,
          previousStock: product.currentStock - line.quantity,
          currentStock: product.currentStock,
          lot: line.lot,
          unitCost: line.unitCost,
          createdBy
        });
      }
    });
    
    return mockMovement;
  }

  async createOutgoingMovement(movementData: Partial<Movement>): Promise<Movement> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const createdBy = user.fullName || 'Usuario';
    const now = new Date().toISOString();
    
    const newMovement = {
      ...movementData,
      id: "",
      type: "egreso",
      date: movementData.date || now,
      createdBy,
      createdAt: now,
      status: "active"
    } as Movement;

    if (this.isBackendAvailable) {
      try {
        return await apiService.post<Movement>(`${API_ENDPOINTS.movements}/outgoing`, newMovement);
      } catch (error) {
        console.error("Error creating outgoing movement via API, using mock data", error);
      }
    }
    
    // Mock implementation
    const mockMovement = {
      ...newMovement,
      id: `m${mockMovements.length + 1}`
    };
    mockMovements.push(mockMovement);
    
    // Update product stock in mock data
    mockMovement.lines.forEach(line => {
      const product = mockProducts.find(p => p.id === line.productId);
      if (product) {
        product.currentStock -= line.quantity;
      }
    });
    
    // Create kardex entries
    mockMovement.lines.forEach(line => {
      const product = mockProducts.find(p => p.id === line.productId);
      if (product) {
        mockKardex.push({
          id: `k${mockKardex.length + 1}`,
          date: mockMovement.date,
          movementId: mockMovement.id,
          type: "egreso",
          productId: line.productId,
          warehouseId: mockMovement.warehouseId,
          quantity: line.quantity,
          previousStock: product.currentStock + line.quantity,
          currentStock: product.currentStock,
          createdBy
        });
      }
    });
    
    return mockMovement;
  }

  async cancelMovement(id: string, cancellationReason: string): Promise<Movement | null> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedBy = user.fullName || 'Usuario';
    const now = new Date().toISOString();

    if (this.isBackendAvailable) {
      try {
        return await apiService.put<Movement>(`${API_ENDPOINTS.movements}/${id}/cancel`, {
          cancellationReason,
          updatedBy
        });
      } catch (error) {
        console.error(`Error canceling movement ${id} via API, using mock data`, error);
      }
    }
    
    // Mock implementation
    const index = mockMovements.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    const movement = mockMovements[index];
    if (movement.status === "cancelled") return null;
    
    // Update stock for products
    movement.lines.forEach(line => {
      const product = mockProducts.find(p => p.id === line.productId);
      if (product) {
        if (movement.type === "ingreso") {
          product.currentStock -= line.quantity;
        } else {
          product.currentStock += line.quantity;
        }
      }
    });
    
    // Update movement
    mockMovements[index] = {
      ...movement,
      status: "cancelled",
      cancellationReason,
      updatedBy,
      updatedAt: now
    };
    
    return mockMovements[index];
  }

  // Kardex
  async getKardexEntries(productId?: string, warehouseId?: string, startDate?: string, endDate?: string): Promise<KardexEntry[]> {
    if (this.isBackendAvailable) {
      try {
        let url = `${API_ENDPOINTS.kardex}?`;
        if (productId) url += `productId=${productId}&`;
        if (warehouseId) url += `warehouseId=${warehouseId}&`;
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
        return await apiService.get<KardexEntry[]>(url);
      } catch (error) {
        console.error("Error fetching kardex entries from API, using mock data", error);
      }
    }
    
    // Mock implementation
    return mockKardex.filter(entry => {
      if (productId && entry.productId !== productId) return false;
      if (warehouseId && entry.warehouseId !== warehouseId) return false;
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });
  }

  async getStockSummary(warehouseId?: string): Promise<StockSummary[]> {
    if (this.isBackendAvailable) {
      try {
        const url = warehouseId 
          ? `${API_ENDPOINTS.reports}/stock?warehouseId=${warehouseId}` 
          : `${API_ENDPOINTS.reports}/stock`;
        return await apiService.get<StockSummary[]>(url);
      } catch (error) {
        console.error("Error fetching stock summary from API, using mock data", error);
      }
    }
    
    // Mock implementation - simple version that doesn't account for multiple warehouses
    const summary: StockSummary[] = [];
    
    mockProducts.forEach(product => {
      mockWarehouses.forEach(warehouse => {
        if (!warehouseId || warehouse.id === warehouseId) {
          summary.push({
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            quantity: product.currentStock / mockWarehouses.length, // Simplistic distribution
            lastMovement: mockMovements.length > 0 ? mockMovements[0].date : new Date().toISOString()
          });
        }
      });
    });
    
    return summary;
  }

  // Reports
  async getStockReport(warehouseId?: string): Promise<StockReportItem[]> {
    // This would call the API in a real application
    // Here we're just transforming the mock data
    
    const stockItems: StockReportItem[] = [];
    
    mockProducts.forEach(product => {
      stockItems.push({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        unit: product.unit,
        warehouse: warehouseId 
          ? mockWarehouses.find(w => w.id === warehouseId)?.name || "Unknown"
          : "Todos",
        stock: product.currentStock,
        lastMovement: "2025-07-20" // Sample date
      });
    });
    
    return stockItems;
  }

  async getMovementsReport(type?: string, startDate?: string, endDate?: string): Promise<MovementReportItem[]> {
    // Filter movements based on parameters
    const filteredMovements = mockMovements.filter(m => {
      if (type && m.type !== type) return false;
      if (startDate && m.date < startDate) return false;
      if (endDate && m.date > endDate) return false;
      return true;
    });
    
    // Transform to report format
    return filteredMovements.map(m => {
      const totalValue = m.lines.reduce((sum, line) => {
        return sum + (line.quantity * (line.unitCost || 0));
      }, 0);
      
      return {
        id: m.id,
        date: m.date,
        type: m.type,
        warehouseName: m.warehouseName,
        documentInfo: m.type === "ingreso" ? m.supplierName || "" : m.requestedBy || "",
        totalItems: m.totalItems,
        totalValue,
        status: m.status
      };
    });
  }

  async getRotationReport(startDate?: string, endDate?: string): Promise<RotationReportItem[]> {
    // In a real application, this would be calculated by the backend
    // Here we're creating sample rotation data
    
    return mockProducts.map(product => {
      // Random initial and final stock
      const initialStock = Math.floor(product.currentStock * 0.7);
      const finalStock = product.currentStock;
      
      // Random entries and exits
      const entries = Math.floor(Math.random() * 100);
      const exits = Math.floor(Math.random() * entries);
      
      // Calculate average stock
      const avgStock = (initialStock + finalStock) / 2;
      
      // Calculate rotation index
      const rotationIndex = avgStock > 0 ? exits / avgStock : 0;
      
      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        initialStock,
        entries,
        exits,
        finalStock,
        avgStock,
        rotationIndex
      };
    });
  }
}

const inventoryService = new InventoryService();
export default inventoryService;