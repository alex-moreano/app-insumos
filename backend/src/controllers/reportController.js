const Movement = require('../models/movementModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Get movements with filters
exports.getMovements = async (req, res) => {
  try {
    const { startDate, endDate, type, productId, warehouseId } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (productId) {
      filter.productId = new mongoose.Types.ObjectId(productId);
    }
    
    if (warehouseId) {
      filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    }
    
    // Get movements with populated references
    const movements = await Movement.find(filter)
      .populate('productId', 'name sku unit')
      .populate('warehouseId', 'name')
      .populate('supplierId', 'name')
      .populate('userId', 'name')
      .sort({ date: -1 });
    
    // Format response
    const formattedMovements = movements.map(movement => ({
      _id: movement._id,
      type: movement.type,
      productId: movement.productId._id,
      productName: movement.productId.name,
      quantity: movement.quantity,
      date: movement.date,
      supplier: movement.supplierId ? movement.supplierId.name : null,
      warehouse: movement.warehouseId ? movement.warehouseId.name : null,
      createdBy: movement.userId ? movement.userId.name : 'Sistema'
    }));
    
    res.status(200).json(formattedMovements);
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ message: 'Error al obtener los movimientos' });
  }
};

// Get kardex for a specific product
exports.getKardex = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }
    
    // Get product info
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Build filter object
    const filter = { productId: new mongoose.Types.ObjectId(productId) };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }
    
    // Get movements for this product, sorted by date
    const movements = await Movement.find(filter)
      .populate('productId', 'name sku unit price')
      .populate('warehouseId', 'name')
      .populate('supplierId', 'name')
      .populate('userId', 'name')
      .sort({ date: 1 });
    
    // Calculate running balance
    let balance = 0;
    const entries = [];
    
    movements.forEach(movement => {
      const entry = {
        date: movement.date,
        type: movement.type,
        description: movement.type === 'input' 
          ? `Entrada desde ${movement.supplierId ? movement.supplierId.name : 'Desconocido'}` 
          : `Salida hacia ${movement.warehouseId ? movement.warehouseId.name : 'Desconocido'}`,
        input: movement.type === 'input' ? movement.quantity : 0,
        output: movement.type === 'output' ? movement.quantity : 0,
        unitPrice: movement.price || product.price || 0,
      };
      
      // Update balance
      if (movement.type === 'input') {
        balance += movement.quantity;
      } else {
        balance -= movement.quantity;
      }
      
      entry.balance = balance;
      entry.totalValue = entry.balance * entry.unitPrice;
      
      entries.push(entry);
    });
    
    // Format response
    const kardexData = {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit
      },
      entries
    };
    
    res.status(200).json(kardexData);
  } catch (error) {
    console.error('Error fetching kardex:', error);
    res.status(500).json({ message: 'Error al obtener el kardex' });
  }
};

// Get stock report
exports.getStockReport = async (req, res) => {
  try {
    const { warehouseId, categoryId } = req.query;
    
    // Build match stage for aggregation
    const match = {};
    
    if (warehouseId) {
      match.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    }
    
    if (categoryId) {
      match.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    
    // Get current stock levels
    const products = await Product.find({})
      .populate('category', 'name')
      .populate({
        path: 'stockByWarehouse',
        populate: {
          path: 'warehouseId',
          model: 'Warehouse',
          select: 'name'
        }
      });
    
    // Format response based on filters
    let stockReport = products.map(product => {
      const stockData = {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        category: product.category ? product.category.name : 'Sin categoría',
        price: product.price,
        totalStock: product.stockByWarehouse.reduce(
          (total, item) => total + item.quantity, 0
        ),
        warehouses: product.stockByWarehouse.map(item => ({
          warehouseId: item.warehouseId._id,
          warehouseName: item.warehouseId.name,
          quantity: item.quantity
        }))
      };
      
      // Apply warehouse filter if specified
      if (warehouseId) {
        stockData.warehouses = stockData.warehouses.filter(
          w => w.warehouseId.toString() === warehouseId
        );
        stockData.totalStock = stockData.warehouses.reduce(
          (total, item) => total + item.quantity, 0
        );
      }
      
      return stockData;
    });
    
    // Apply category filter if specified
    if (categoryId) {
      stockReport = stockReport.filter(item => 
        item.category && item.category._id && 
        item.category._id.toString() === categoryId
      );
    }
    
    res.status(200).json(stockReport);
  } catch (error) {
    console.error('Error fetching stock report:', error);
    res.status(500).json({ message: 'Error al obtener el reporte de inventario' });
  }
};