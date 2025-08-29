const express = require('express');
const router = express.Router();
const { 
  getKardexEntries,
  getKardexById,
  getProductBalance
} = require('../controllers/kardexController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Rutas de kardex
router.route('/')
  .get(authMiddleware, getKardexEntries);

router.route('/:id')
  .get(authMiddleware, getKardexById);

router.route('/balance/:productId')
  .get(authMiddleware, getProductBalance);

module.exports = router;
