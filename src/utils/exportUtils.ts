import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MovementReport, KardexEntry, KardexReport } from '../services/ReportService';

// Add type definition for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

// Export data to Excel
export const exportToExcel = (data: Record<string, string | number>[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Format date for reports
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Export movement report to PDF
export const exportMovementsToPdf = (data: MovementReport[], title: string) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, 14, 30);

  // Format data for table
  const tableData = data.map(item => [
    formatDate(item.date),
    item.type === 'ingreso' ? 'Entrada' : 'Salida',
    item.productName,
    item.quantity.toString(),
    item.supplier || item.warehouse || '-',
    item.createdBy
  ]);

  // Create table
  doc.autoTable({
    startY: 40,
    head: [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Origen/Destino', 'Creado por']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Save the PDF
  doc.save(`${title}.pdf`);
};

// Export kardex report to PDF
export const exportKardexToPdf = (kardexData: KardexReport) => {
  const doc = new jsPDF();
  const { product, entries } = kardexData;

  // Add title and product info
  doc.setFontSize(18);
  doc.text('Reporte de Kardex', 14, 22);
  
  doc.setFontSize(12);
  doc.text(`Producto: ${product.name}`, 14, 32);
  doc.text(`Código: ${product.code}`, 14, 38);
  doc.text(`Unidad: ${product.unit}`, 14, 44);
  doc.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, 14, 50);

  // Format data for table
  const tableData = entries.map(entry => [
    formatDate(entry.date),
    entry.type === 'input' ? 'Entrada' : 'Salida',
    entry.description,
    entry.input.toString(),
    entry.output.toString(),
    entry.balance.toString(),
    entry.unitPrice ? `$${entry.unitPrice.toFixed(2)}` : '-',
    entry.totalValue ? `$${entry.totalValue.toFixed(2)}` : '-'
  ]);

  // Create table
  doc.autoTable({
    startY: 60,
    head: [['Fecha', 'Tipo', 'Descripción', 'Entrada', 'Salida', 'Balance', 'Precio Unit.', 'Valor Total']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Save the PDF
  doc.save(`Kardex_${product.name}.pdf`);
};

// Export kardex data to Excel
export const exportKardexToExcel = (kardexData: KardexReport) => {
  const { product, entries } = kardexData;
  
  // Add product information at the top of the sheet
  const worksheetData = [
    { A: 'Información del Producto', B: '' },
    { A: 'Nombre:', B: product.name },
    { A: 'Código:', B: product.code },
    { A: 'Unidad:', B: product.unit },
    { A: 'Fecha de generación:', B: formatDate(new Date().toISOString()) },
    { A: '' }, // Empty row
    // Headers
    {
      A: 'Fecha',
      B: 'Tipo',
      C: 'Descripción',
      D: 'Entrada',
      E: 'Salida',
      F: 'Balance',
      G: 'Precio Unitario',
      H: 'Valor Total'
    },
  ];

  // Add entries data
  entries.forEach(entry => {
    worksheetData.push({
      A: formatDate(entry.date),
      B: entry.type === 'input' ? 'Entrada' : 'Salida',
      C: entry.description,
      D: entry.input,
      E: entry.output,
      F: entry.balance,
      G: entry.unitPrice ? entry.unitPrice : '-',
      H: entry.totalValue ? entry.totalValue : '-'
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: true });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kardex');
  XLSX.writeFile(workbook, `Kardex_${product.name}.xlsx`);
};