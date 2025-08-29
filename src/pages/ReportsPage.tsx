import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ClipboardList } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { reportService, MovementReport } from '../services/ReportService';
import { formatDate, exportToExcel, exportMovementsToPdf } from '../utils/exportUtils';

interface Product {
  _id: string;
  name: string;
}

interface Warehouse {
  _id: string;
  name: string;
}

interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  productId?: string;
  warehouseId?: string;
}

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const token = user.token;
  const [activeTab, setActiveTab] = useState('movements');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movementReports, setMovementReports] = useState<MovementReport[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, setValue, watch } = useForm<ReportFilters>({
    defaultValues: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
      endDate: new Date(),
      type: 'all',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Fetch products and warehouses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await axios.get(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(productsResponse.data);

        // Fetch warehouses
        const warehousesResponse = await axios.get(`${API_URL}/api/warehouses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWarehouses(warehousesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // Handle generating reports
  const generateReport = async (data: ReportFilters) => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      
      // Format dates for API
      if (data.startDate) {
        filters.startDate = data.startDate.toISOString();
      }
      if (data.endDate) {
        filters.endDate = data.endDate.toISOString();
      }
      
      // Add other filters
      if (data.type && data.type !== 'all') {
        filters.type = data.type;
      }
      if (data.productId) {
        filters.productId = data.productId;
      }
      if (data.warehouseId) {
        filters.warehouseId = data.warehouseId;
      }

      // Get appropriate report based on active tab
      if (activeTab === 'movements') {
        const movements = await reportService.getMovements(token, filters);
        setMovementReports(movements);
      }
      // Add other report types here when implemented
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export movement reports to Excel
  const handleExportToExcel = () => {
    if (movementReports.length === 0) return;
    
    // Format data for Excel
    const data = movementReports.map(item => ({
      Fecha: formatDate(item.date),
      Tipo: item.type === 'input' ? 'Entrada' : 'Salida',
      Producto: item.productName,
      Cantidad: item.quantity,
      'Origen/Destino': item.supplier || item.warehouse || '-',
      'Creado por': item.createdBy
    }));
    
    exportToExcel(data, 'Reporte_Movimientos');
  };

  // Export movement reports to PDF
  const handleExportToPdf = () => {
    if (movementReports.length === 0) return;
    
    // Generate PDF
    exportMovementsToPdf(movementReports, 'Reporte de Movimientos');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reportes</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-[500px]">
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="kardex">Kardex</TabsTrigger>
          <TabsTrigger value="stock">Inventario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Movimientos</CardTitle>
              <CardDescription>
                Genera reportes de movimientos de entrada y salida de productos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(generateReport)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => setValue('startDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha Fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => setValue('endDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Movimiento</Label>
                    <Select 
                      onValueChange={(value) => setValue('type', value)} 
                      defaultValue="all"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="input">Entradas</SelectItem>
                        <SelectItem value="output">Salidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="productId">Producto</Label>
                    <Select 
                      onValueChange={(value) => setValue('productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los productos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los productos</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="warehouseId">Bodega</Label>
                    <Select 
                      onValueChange={(value) => setValue('warehouseId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las bodegas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas las bodegas</SelectItem>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse._id} value={warehouse._id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Generando...' : 'Generar Reporte'}
                  </Button>
                </div>
              </form>

              {movementReports.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Resultados</h3>
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={handleExportToExcel}
                        size="sm"
                      >
                        Exportar a Excel
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleExportToPdf}
                        size="sm"
                      >
                        Exportar a PDF
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Table>
                    <TableCaption>Reporte de movimientos de inventario</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Origen/Destino</TableHead>
                        <TableHead>Usuario</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementReports.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            {item.type === 'input' ? 'Entrada' : 'Salida'}
                          </TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.supplier || item.warehouse || '-'}
                          </TableCell>
                          <TableCell>{item.createdBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="kardex">
          <Card>
            <CardHeader>
              <CardTitle>Kardex de Productos</CardTitle>
              <CardDescription>
                Consulta el historial de movimientos detallado por producto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">¿Qué es el Kardex?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    El kardex es un registro detallado de todos los movimientos (entradas y salidas) de un producto específico en el inventario,
                    mostrando el historial completo con fechas, cantidades, precios y balances actualizados.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">¿Cómo acceder al Kardex?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Para ver el kardex de un producto específico, puedes:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                      <li>Ir a la página de Productos</li>
                      <li>Localizar el producto que desea consultar</li>
                      <li>Hacer clic en el icono de Kardex <span className="inline-block align-middle"><ClipboardList className="h-4 w-4 inline" /></span> junto al producto</li>
                    </ol>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button onClick={() => navigate('/productos')} className="mr-2">
                    Ir a Productos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Inventario</CardTitle>
              <CardDescription>
                Genera reportes del estado actual del inventario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Esta sección está en desarrollo. Pronto podrás generar reportes detallados del estado actual de tu inventario.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;