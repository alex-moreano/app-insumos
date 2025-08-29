const express = require('express');
const router = express.Router();
const { 
  createSupplier, 
  getSuppliers, 
  getSupplierById, 
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// Routes
router.route('/')
  .get(authMiddleware, getSuppliers)       // Obtener todos los proveedores
  .post(authMiddleware, createSupplier);   // Crear proveedor

router.route('/:id')
  .get(authMiddleware, getSupplierById)    // Obtener proveedor por ID
  .put(authMiddleware, updateSupplier)     // Actualizar proveedor
  .delete(authMiddleware, admin, deleteSupplier); // Desactivar proveedor (solo admin)

module.exports = router;
