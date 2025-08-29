const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser
} = require('../controllers/userController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// Debug log para verificar imports
console.log({ authMiddleware, admin, registerUser });

// Rutas públicas
router.post('/login', loginUser);

// Rutas privadas / administración
router.post('/', authMiddleware, admin, registerUser);

router.route('/profile')
  .get(authMiddleware, getUserProfile)
  .put(authMiddleware, updateUserProfile);

router.route('/')
  .get(authMiddleware, admin, getUsers);

router.route('/:id')
  .get(authMiddleware, admin, getUserById)
  .put(authMiddleware, admin, updateUser)
  .delete(authMiddleware, admin, deleteUser);

module.exports = router;
