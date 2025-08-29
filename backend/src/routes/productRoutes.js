const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(authMiddleware, getProducts)
  .post(authMiddleware, createProduct);

router.route('/:id')
  .get(authMiddleware, getProductById)
  .put(authMiddleware, updateProduct)
  .delete(authMiddleware, admin, deleteProduct);

module.exports = router;
