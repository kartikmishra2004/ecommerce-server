const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(userValidation.register), register);
router.post('/login', validate(userValidation.login), login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/change-password', validate(userValidation.changePassword), changePassword);

module.exports = router;