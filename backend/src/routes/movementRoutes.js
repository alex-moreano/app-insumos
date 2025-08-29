const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { 
  createMovement, 
  getMovements, 
  getMovementById, 
  cancelMovement
} = require('../controllers/movementController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// Rutas normales
router.route('/')
  .get(authMiddleware, getMovements)      
  .post(authMiddleware, createMovement);

// Obtener por ID
router.route('/:id')
  .get(authMiddleware, getMovementById);

// Cancelar
router.route('/:id/cancel')
  .put(authMiddleware, admin, cancelMovement);

// Alias para ingreso
router.post('/incoming', authMiddleware, asyncHandler(async (req, res) => {
  req.body.type = 'ingreso';
  await createMovement(req, res);
}));

// Alias para egreso
router.post('/outgoing', authMiddleware, asyncHandler(async (req, res) => {
  req.body.type = 'egreso';
  await createMovement(req, res);
}));

module.exports = router;
