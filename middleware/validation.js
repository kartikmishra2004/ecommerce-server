const Joi = require('joi');
const { createError } = require('../utils/errorHandler');

/**
 * Generic validation middleware
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(createError(errorMessage, 400));
    }

    // Replace the original data with validated data
    req[property] = value;
    next();
  };
};

// User validation schemas
const userValidation = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string().email().lowercase().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(6).max(128).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
      }),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    address: Joi.object({
      street: Joi.string().trim().max(100).optional(),
      city: Joi.string().trim().max(50).optional(),
      state: Joi.string().trim().max(50).optional(),
      zipCode: Joi.string().trim().max(20).optional(),
      country: Joi.string().trim().max(50).optional()
    }).optional(),
    role: Joi.string().valid('user', 'admin').optional()
      .messages({
        'any.only': 'Role must be either user or admin'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(''),
    address: Joi.object({
      street: Joi.string().trim().max(100).optional().allow(''),
      city: Joi.string().trim().max(50).optional().allow(''),
      state: Joi.string().trim().max(50).optional().allow(''),
      zipCode: Joi.string().trim().max(20).optional().allow(''),
      country: Joi.string().trim().max(50).optional().allow('')
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string().min(6).max(128).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'New password is required'
      })
  })
};

// Product validation schemas
const productValidation = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name cannot exceed 100 characters',
        'any.required': 'Product name is required'
      }),
    description: Joi.string().trim().min(10).max(2000).required()
      .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 2000 characters',
        'any.required': 'Product description is required'
      }),
    price: Joi.number().min(0).required()
      .messages({
        'number.min': 'Price cannot be negative',
        'any.required': 'Product price is required'
      }),
    comparePrice: Joi.number().min(0).optional()
      .messages({
        'number.min': 'Compare price cannot be negative'
      }),
    category: Joi.string().valid(
      'electronics', 'clothing', 'books', 'home', 'sports', 
      'beauty', 'toys', 'automotive', 'health', 'food', 'other'
    ).required()
      .messages({
        'any.only': 'Please select a valid category',
        'any.required': 'Product category is required'
      }),
    brand: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.min': 'Brand name is required',
        'string.max': 'Brand name cannot exceed 50 characters',
        'any.required': 'Brand name is required'
      }),
    sku: Joi.string().trim().min(3).max(50).required()
      .messages({
        'string.min': 'SKU must be at least 3 characters long',
        'string.max': 'SKU cannot exceed 50 characters',
        'any.required': 'SKU is required'
      }),
    stock: Joi.number().integer().min(0).required()
      .messages({
        'number.min': 'Stock cannot be negative',
        'number.integer': 'Stock must be a whole number',
        'any.required': 'Stock quantity is required'
      }),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(100).optional().allow(''),
        isPrimary: Joi.boolean().optional()
      })
    ).min(1).required()
      .messages({
        'array.min': 'At least one product image is required',
        'any.required': 'Product images are required'
      }),
    specifications: Joi.object().pattern(/.*/, Joi.string()).optional(),
    tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
    weight: Joi.number().min(0).optional(),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional()
    }).optional(),
    isFeatured: Joi.boolean().optional(),
    seoTitle: Joi.string().max(60).optional().allow(''),
    seoDescription: Joi.string().max(160).optional().allow('')
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    description: Joi.string().trim().min(10).max(2000).optional(),
    price: Joi.number().min(0).optional(),
    comparePrice: Joi.number().min(0).optional(),
    category: Joi.string().valid(
      'electronics', 'clothing', 'books', 'home', 'sports', 
      'beauty', 'toys', 'automotive', 'health', 'food', 'other'
    ).optional(),
    brand: Joi.string().trim().min(1).max(50).optional(),
    sku: Joi.string().trim().min(3).max(50).optional(),
    stock: Joi.number().integer().min(0).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(100).optional().allow(''),
        isPrimary: Joi.boolean().optional()
      })
    ).min(1).optional(),
    specifications: Joi.object().pattern(/.*/, Joi.string()).optional(),
    tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
    weight: Joi.number().min(0).optional(),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional()
    }).optional(),
    isActive: Joi.boolean().optional(),
    isFeatured: Joi.boolean().optional(),
    seoTitle: Joi.string().max(60).optional().allow(''),
    seoDescription: Joi.string().max(160).optional().allow('')
  }),

  query: Joi.object({
    category: Joi.string().optional(),
    brand: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    inStock: Joi.boolean().optional(),
    featured: Joi.boolean().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().valid(
      'createdAt', '-createdAt', 'name', '-name', 'price', '-price', 
      'rating.average', '-rating.average', 'stock', '-stock'
    ).optional()
  })
};

// Parameter validation schemas
const paramValidation = {
  objectId: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({
        'string.hex': 'Invalid ID format',
        'string.length': 'Invalid ID format',
        'any.required': 'ID is required'
      })
  })
};

module.exports = {
  validate,
  userValidation,
  productValidation,
  paramValidation
};