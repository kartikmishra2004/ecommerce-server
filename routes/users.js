const express = require('express');
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validate, userValidation, paramValidation } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.get('/stats', authorize('admin'), getUserStats);
router.patch('/:id/status', 
  authorize('admin'),
  validate(paramValidation.objectId, 'params'),
  toggleUserStatus
);

// Routes accessible by user themselves or admin
router.get('/:id', validate(paramValidation.objectId, 'params'), getUser);
router.put('/:id', 
  validate(paramValidation.objectId, 'params'),
  validate(userValidation.updateProfile),
  updateUser
);
router.delete('/:id', validate(paramValidation.objectId, 'params'), deleteUser);

module.exports = router;