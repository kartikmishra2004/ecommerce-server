const express = require('express');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateStock,
  getFeaturedProducts,
  getProductsByCategory,
  getProductStats
} = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validate, productValidation, paramValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', validate(productValidation.query, 'query'), getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', validate(paramValidation.objectId, 'params'), getProduct);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', validate(productValidation.create), createProduct);
router.get('/admin/stats', getProductStats);
router.put('/:id', 
  validate(paramValidation.objectId, 'params'),
  validate(productValidation.update),
  updateProduct
);
router.delete('/:id', validate(paramValidation.objectId, 'params'), deleteProduct);
router.patch('/:id/status', 
  validate(paramValidation.objectId, 'params'),
  toggleProductStatus
);
router.patch('/:id/stock', 
  validate(paramValidation.objectId, 'params'),
  updateStock
);

module.exports = router;