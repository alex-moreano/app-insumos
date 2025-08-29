const express = require('express');
const router = express.Router();
const { 
  createIntake, 
  getIntakes, 
  getIntakeById, 
  cancelIntake
} = require('../controllers/intakeController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// Rutas de intake
router.route('/')
  .get(authMiddleware, getIntakes)      // Obtener intakes
  .post(authMiddleware, createIntake);  // Crear intake

router.route('/:id')
  .get(authMiddleware, getIntakeById);  // Obtener intake por ID

router.route('/:id/cancel')
  .put(authMiddleware, admin, cancelIntake); // Cancelar intake (solo admin)

module.exports = router;
