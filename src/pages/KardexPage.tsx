import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { reportService, KardexReport } from '../services/ReportService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
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
import { formatDate, exportKardexToPdf, exportKardexToExcel } from '../utils/exportUtils';

const KardexPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useContext(AuthContext);
  const token = user.token;
  const navigate = useNavigate();
  const [kardexData, setKardexData] = useState<KardexReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Fetch kardex data
  const fetchKardexData = async () => {
    if (!productId || !token) return;
    
    setLoading(true);
    try {
      const formattedStartDate = startDate ? startDate.toISOString() : undefined;
      const formattedEndDate = endDate ? endDate.toISOString() : undefined;
      
      const data = await reportService.getKardex(
        token,
        productId,
        formattedStartDate,
        formattedEndDate
      );
      setKardexData(data);
    } catch (error) {
      console.error('Error fetching kardex data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchKardexData();
  }, [productId, token]);

  // Handle going back to product page
  const handleBack = () => {
    navigate(productId ? '/productos' : -1);
  };

  // Handle date filter changes
  const handleFilterChange = () => {
    fetchKardexData();
  };

  // Export to PDF
  const handleExportToPdf = () => {
    if (!kardexData) return;
    exportKardexToPdf(kardexData);
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!kardexData) return;
    exportKardexToExcel(kardexData);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Kardex de Producto</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {kardexData?.product.name || 'Cargando...'}
              </CardTitle>
              <CardDescription>
                {kardexData?.product.code ? `Código: ${kardexData.product.code}` : ''}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportToExcel}
                disabled={!kardexData}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportToPdf}
                disabled={!kardexData}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
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
                    onSelect={setStartDate}
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
                    variant="outline"
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
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex justify-end mb-6">
            <Button onClick={handleFilterChange} disabled={loading}>
              {loading ? 'Cargando...' : 'Filtrar'}
            </Button>
          </div>
          
          <Separator className="my-6" />
          
          {loading ? (
            <div className="text-center py-8">Cargando datos de kardex...</div>
          ) : kardexData?.entries && kardexData.entries.length > 0 ? (
            <Table>
              <TableCaption>Kardex del producto {kardexData.product.name}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Salida</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kardexData.entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      {entry.type === 'ingreso' ? 'Entrada' : 'Salida'}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">{entry.input || '-'}</TableCell>
                    <TableCell className="text-right">{entry.output || '-'}</TableCell>
                    <TableCell className="text-right">{entry.balance}</TableCell>
                    <TableCell className="text-right">
                      {entry.unitPrice ? `$${entry.unitPrice.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.totalValue ? `$${entry.totalValue.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              No hay registros de kardex para este producto en el rango de fechas seleccionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KardexPage;