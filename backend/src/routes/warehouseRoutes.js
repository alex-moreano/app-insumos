const express = require('express');
const router = express.Router();
const { 
  createWarehouse, 
  getWarehouses, 
  getWarehouseById, 
  updateWarehouse,
  deleteWarehouse
} = require('../controllers/warehouseController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(authMiddleware, getWarehouses)
  .post(authMiddleware, admin, createWarehouse);

router.route('/:id')
  .get(authMiddleware, getWarehouseById)
  .put(authMiddleware, admin, updateWarehouse)
  .delete(authMiddleware, admin, deleteWarehouse);

module.exports = router;
