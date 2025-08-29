const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

// Get movement reports with filters
router.get('/movements', authMiddleware, reportController.getMovements);

// Get kardex for a specific product
router.get('/kardex/:productId', authMiddleware, reportController.getKardex);

// Get stock report
router.get('/stock', authMiddleware, reportController.getStockReport);

module.exports = router;