import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowDownIcon, ArrowUpIcon, BoxIcon, PackageOpen, PackagePlus, TruckIcon } from "lucide-react";
import inventoryService from "@/services/InventoryService";

// Dashboard data interface
interface DashboardData {
  totalProducts: number;
  totalStock: number;
  totalWarehouses: number;
  recentMovements: {
    id: string;
    type: string;
    product: string;
    quantity: number;
    date: string;
  }[];
  monthlyStats: {
    incomingTotal: number;
    outgoingTotal: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    totalStock: 0,
    totalWarehouses: 0,
    recentMovements: [],
    monthlyStats: {
      incomingTotal: 0,
      outgoingTotal: 0,
    }
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Load products count
        const products = await inventoryService.getProducts();
        
        // Calculate total stock
        const totalStockSum = products.reduce((sum, p) => sum + p.currentStock, 0);
        
        // Load warehouses count
        const warehouses = await inventoryService.getWarehouses();
        
        // Load recent movements
        const allMovements = await inventoryService.getMovements();
        const sortedMovements = allMovements.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Get recent movements
        const recentMovements = sortedMovements.slice(0, 4).map(m => ({
          id: m.id,
          type: m.type,
          // Just take the first product for simplicity
          product: m.lines[0]?.productName || "Producto desconocido",
          quantity: m.totalItems,
          date: m.date
        }));
        
        // Calculate monthly stats
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // Filter movements for current month
        const currentMonthMovements = allMovements.filter(
          m => new Date(m.date) >= new Date(firstDayOfMonth) && m.status === "active"
        );
        
        // Calculate totals
        const incomingTotal = currentMonthMovements
          .filter(m => m.type === "ingreso")
          .reduce((sum, m) => sum + m.totalItems, 0);
          
        const outgoingTotal = currentMonthMovements
          .filter(m => m.type === "egreso")
          .reduce((sum, m) => sum + m.totalItems, 0);
        
        // Update dashboard data
        setDashboardData({
          totalProducts: products.length,
          totalStock: totalStockSum,
          totalWarehouses: warehouses.length,
          recentMovements,
          monthlyStats: {
            incomingTotal,
            outgoingTotal
          }
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bienvenido, {user?.fullName || "Usuario"}. Aquí tienes un resumen del estado actual del inventario.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-lg">Cargando información...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Productos
                </CardTitle>
                <BoxIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Productos registrados en el sistema
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Total
                </CardTitle>
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalStock} unidades</div>
                <p className="text-xs text-muted-foreground">
                  En todos los almacenes
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos del Mes
                </CardTitle>
                <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.monthlyStats.incomingTotal}</div>
                <p className="text-xs text-muted-foreground">
                  Unidades recibidas este mes
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Egresos del Mes
                </CardTitle>
                <ArrowDownIcon className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.monthlyStats.outgoingTotal}</div>
                <p className="text-xs text-muted-foreground">
                  Unidades despachadas este mes
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Movimientos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.recentMovements.length > 0 ? (
                    dashboardData.recentMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          {movement.type === "ingreso" ? (
                            <div className="p-1.5 rounded-full bg-emerald-100">
                              <PackagePlus className="h-5 w-5 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-full bg-rose-100">
                              <PackageOpen className="h-5 w-5 text-rose-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{movement.product}</div>
                            <div className="text-sm text-muted-foreground">
                              {movement.type === "ingreso" ? "Ingreso" : "Egreso"} de {movement.quantity} unidades
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(movement.date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      No hay movimientos recientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingresos vs Egresos (Mes)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[250px]">
                {dashboardData.monthlyStats.incomingTotal > 0 || dashboardData.monthlyStats.outgoingTotal > 0 ? (
                  <div className="flex items-center justify-center gap-8 w-full h-52">
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="h-36 w-16 bg-emerald-500 rounded-t-md relative flex items-end justify-center"
                        style={{ 
                          height: `${Math.min(144, dashboardData.monthlyStats.incomingTotal / 10)}px` 
                        }}
                      >
                        <div className="absolute -top-8 text-sm font-medium">
                          {dashboardData.monthlyStats.incomingTotal}
                        </div>
                      </div>
                      <div className="text-sm font-medium">Ingresos</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="h-28 w-16 bg-rose-500 rounded-t-md relative flex items-end justify-center"
                        style={{ 
                          height: `${Math.min(144, dashboardData.monthlyStats.outgoingTotal / 10)}px` 
                        }}
                      >
                        <div className="absolute -top-8 text-sm font-medium">
                          {dashboardData.monthlyStats.outgoingTotal}
                        </div>
                      </div>
                      <div className="text-sm font-medium">Egresos</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No hay datos suficientes para este mes
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <a 
                    href="/ingresos"
                    className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
                  >
                    <PackagePlus className="h-8 w-8 text-emerald-600 mb-2" />
                    <span className="font-medium">Ingresos</span>
                  </a>
                  <a 
                    href="/egresos"
                    className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
                  >
                    <PackageOpen className="h-8 w-8 text-rose-600 mb-2" />
                    <span className="font-medium">Egresos</span>
                  </a>
                  <a 
                    href="/kardex"
                    className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
                  >
                    <TruckIcon className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="font-medium">Kardex</span>
                  </a>
                  <a 
                    href="/reportes"
                    className="flex flex-col items-center p-4 border rounded-md hover:bg-muted transition-colors"
                  >
                    <ArrowUpIcon className="h-8 w-8 text-amber-600 mb-2" />
                    <span className="font-medium">Reportes</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}