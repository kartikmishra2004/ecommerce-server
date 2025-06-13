const Product = require('../models/Product');
const { createError, asyncHandler } = require('../utils/errorHandler');

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = asyncHandler(async (req, res, next) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    featured,
    search,
    page = 1,
    limit = 12,
    sort = '-createdAt'
  } = req.query;

  // Build query
  const query = { isActive: true };

  // Apply filters
  if (category) {
    query.category = category;
  }

  if (brand) {
    query.brand = new RegExp(brand, 'i');
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  // Get products
  const products = await Product.find(query)
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get unique categories and brands for filtering
  const categories = await Product.distinct('category', { isActive: true });
  const brands = await Product.distinct('brand', { isActive: true });

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        categories: categories.sort(),
        brands: brands.sort()
      }
    }
  });
});

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isActive: true
  }).populate('createdBy', 'name email');

  if (!product) {
    return next(createError('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      product
    }
  });
});

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res, next) => {
  const productData = {
    ...req.body,
    createdBy: req.user._id
  };

  // Check if SKU already exists
  const existingProduct = await Product.findOne({ 
    sku: productData.sku.toUpperCase() 
  });
  
  if (existingProduct) {
    return next(createError('Product with this SKU already exists', 409));
  }

  const product = await Product.create(productData);
  await product.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      product
    }
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(createError('Product not found', 404));
  }

  // Check if SKU is being updated and if it already exists
  if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
    const existingProduct = await Product.findOne({ 
      sku: req.body.sku.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    
    if (existingProduct) {
      return next(createError('Product with this SKU already exists', 409));
    }
  }

  // Add updatedBy field
  const updateData = {
    ...req.body,
    updatedBy: req.user._id
  };

  product = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: {
      product
    }
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(createError('Product not found', 404));
  }

  // Soft delete: deactivate product instead of removing from database
  await Product.findByIdAndUpdate(req.params.id, {
    isActive: false,
    updatedBy: req.user._id
  });

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * @desc    Toggle product status (activate/deactivate)
 * @route   PATCH /api/products/:id/status
 * @access  Private/Admin
 */
const toggleProductStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return next(createError('isActive field must be a boolean value', 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(createError('Product not found', 404));
  }

  product.isActive = isActive;
  product.updatedBy = req.user._id;
  await product.save();

  res.status(200).json({
    success: true,
    message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        isActive: product.isActive
      }
    }
  });
});

/**
 * @desc    Update product stock
 * @route   PATCH /api/products/:id/stock
 * @access  Private/Admin
 */
const updateStock = asyncHandler(async (req, res, next) => {
  const { stock, operation = 'set' } = req.body;

  if (typeof stock !== 'number' || stock < 0) {
    return next(createError('Stock must be a positive number', 400));
  }

  if (!['set', 'add', 'subtract'].includes(operation)) {
    return next(createError('Operation must be one of: set, add, subtract', 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(createError('Product not found', 404));
  }

  // Calculate new stock based on operation
  let newStock;
  switch (operation) {
    case 'set':
      newStock = stock;
      break;
    case 'add':
      newStock = product.stock + stock;
      break;
    case 'subtract':
      newStock = Math.max(0, product.stock - stock);
      break;
  }

  product.stock = newStock;
  product.updatedBy = req.user._id;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product stock updated successfully',
    data: {
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        availabilityStatus: product.availabilityStatus
      }
    }
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({
    isActive: true,
    isFeatured: true
  })
    .populate('createdBy', 'name email')
    .sort('-createdAt')
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      products
    }
  });
});

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 12, sort = '-createdAt' } = req.query;

  const query = {
    isActive: true,
    category: category.toLowerCase()
  };

  const skip = (page - 1) * limit;
  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  const products = await Product.find(query)
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  if (products.length === 0) {
    return next(createError(`No products found in category: ${category}`, 404));
  }

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      category
    }
  });
});

/**
 * @desc    Get product statistics
 * @route   GET /api/products/stats
 * @access  Private/Admin
 */
const getProductStats = asyncHandler(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactiveProducts: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        },
        featuredProducts: {
          $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
        },
        totalStock: { $sum: '$stock' },
        averagePrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' }
      }
    }
  ]);

  // Get category distribution
  const categoryStats = await Product.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalStock: { $sum: '$stock' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get low stock products
  const lowStockProducts = await Product.countDocuments({
    isActive: true,
    stock: { $lte: 5, $gt: 0 }
  });

  const outOfStockProducts = await Product.countDocuments({
    isActive: true,
    stock: 0
  });

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalProducts: stats[0]?.totalProducts || 0,
        activeProducts: stats[0]?.activeProducts || 0,
        inactiveProducts: stats[0]?.inactiveProducts || 0,
        featuredProducts: stats[0]?.featuredProducts || 0,
        totalStock: stats[0]?.totalStock || 0,
        averagePrice: stats[0]?.averagePrice || 0,
        maxPrice: stats[0]?.maxPrice || 0,
        minPrice: stats[0]?.minPrice || 0
      },
      inventory: {
        lowStockProducts,
        outOfStockProducts,
        inStockProducts: (stats[0]?.activeProducts || 0) - lowStockProducts - outOfStockProducts
      },
      categories: categoryStats
    }
  });
});

module.exports = {
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
};