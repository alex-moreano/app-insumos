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
      filter['lines.productId'] = new mongoose.Types.ObjectId(productId);
    }
    
    if (warehouseId) {
      filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    }
    
    // Get movements with populated references
    const movements = await Movement.find(filter)
      .populate('warehouseId', 'name')
      .populate('supplierId', 'name')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    
    // Format response - flatten movement lines into individual entries
    const formattedMovements = [];
    movements.forEach(movement => {
      movement.lines.forEach(line => {
        formattedMovements.push({
          _id: movement._id + '_' + line._id,
          movementId: movement._id,
          type: movement.type,
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          date: movement.date,
          supplier: movement.supplierId ? movement.supplierId.name : null,
          warehouse: movement.warehouseId ? movement.warehouseId.name : null,
          createdBy: movement.createdBy ? movement.createdBy.name : 'Sistema',
          lot: line.lot,
          unitCost: line.unitCost,
          note: line.note
        });
      });
    });
    
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
    
    // Build filter object - filter movements that contain this product in their lines
    const filter = { 'lines.productId': new mongoose.Types.ObjectId(productId) };
    
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
      .populate('warehouseId', 'name')
      .populate('supplierId', 'name')
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    
    // Calculate running balance
    let balance = 0;
    const entries = [];
    
    movements.forEach(movement => {
      // Find the line item for this specific product
      const productLine = movement.lines.find(line => 
        line.productId.toString() === productId
      );
      
      if (productLine) {
        const entry = {
          date: movement.date,
          type: movement.type,
          description: movement.type === 'ingreso' 
            ? `Entrada desde ${movement.supplierId ? movement.supplierId.name : 'Desconocido'}` 
            : `Salida hacia ${movement.warehouseId ? movement.warehouseId.name : 'Desconocido'}`,
          input: movement.type === 'ingreso' ? productLine.quantity : 0,
          output: movement.type === 'egreso' ? productLine.quantity : 0,
          unitPrice: productLine.unitCost || product.price || 0,
          lot: productLine.lot || null
        };
        
        // Update balance
        if (movement.type === 'ingreso') {
          balance += productLine.quantity;
        } else {
          balance -= productLine.quantity;
        }
        
        entry.balance = balance;
        entry.totalValue = entry.balance * entry.unitPrice;
        
        entries.push(entry);
      }
    });
    
    // Format response
    const kardexData = {
      product: {
        _id: product._id,
        name: product.name,
        code: product.code,
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
    const productFilter = {};
    
    if (categoryId) {
      productFilter.category = categoryId;
    }
    
    // Get all products with optional category filter
    const products = await Product.find(productFilter);
    
    // Get warehouse information
    const Warehouse = require('../models/warehouseModel');
    let warehouses = [];
    if (warehouseId) {
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: 'Almacén no encontrado' });
      }
      warehouses = [warehouse];
    } else {
      warehouses = await Warehouse.find({ isActive: true });
    }
    
    // Build stock report
    const stockReport = [];
    
    for (const product of products) {
      for (const warehouse of warehouses) {
        // Calculate stock for this product in this warehouse
        // by aggregating movement lines
        const movements = await Movement.find({
          warehouseId: warehouse._id,
          'lines.productId': product._id,
          status: 'active'
        }).populate('lines.productId');
        
        let currentStock = 0;
        let lastMovementDate = null;
        
        movements.forEach(movement => {
          const productLine = movement.lines.find(line => 
            line.productId._id.toString() === product._id.toString()
          );
          
          if (productLine) {
            if (movement.type === 'ingreso') {
              currentStock += productLine.quantity;
            } else if (movement.type === 'egreso') {
              currentStock -= productLine.quantity;
            }
            
            if (!lastMovementDate || movement.date > lastMovementDate) {
              lastMovementDate = movement.date;
            }
          }
        });
        
        // Only include in report if there's stock or movements
        if (currentStock > 0 || lastMovementDate) {
          stockReport.push({
            _id: `${product._id}_${warehouse._id}`,
            productId: product._id,
            productCode: product.code,
            productName: product.name,
            productCategory: product.category,
            productUnit: product.unit,
            warehouseId: warehouse._id,
            warehouseName: warehouse.name,
            quantity: currentStock,
            lastMovement: lastMovementDate
          });
        }
      }
    }
    
    res.status(200).json(stockReport);
  } catch (error) {
    console.error('Error fetching stock report:', error);
    res.status(500).json({ message: 'Error al obtener el reporte de inventario' });
  }
};