/**
 * Custom error handling utilities
 * These utilities are used by the error handling middleware
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new AppError instance
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {AppError} - AppError instance
 */
const createError = (message, statusCode = 500) => {
  return new AppError(message, statusCode);
};

/**
 * Middleware to handle async errors
 * Wraps async functions to catch and forward errors to error handling middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Send error response in development mode
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      status: err.status
    }
  });
};

/**
 * Send error response in production mode
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message
      }
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong!'
      }
    });
  }
};

/**
 * Handle different types of database errors
 * @param {Error} err - Original error
 * @returns {AppError} - Converted AppError
 */
const handleDatabaseErrors = (err) => {
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} '${value}'. Please use another value!`;
    return new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
  }

  return err;
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @returns {AppError} - Converted AppError
 */
const handleJWTErrors = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token. Please log in again!', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Your token has expired! Please log in again.', 401);
  }

  return err;
};

/**
 * Validate request data
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Required fields
 * @returns {string|null} - Error message or null if valid
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => 
    !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
  );

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }

  return null;
};

/**
 * Sanitize error message for client
 * @param {string} message - Original error message
 * @returns {string} - Sanitized error message
 */
const sanitizeErrorMessage = (message) => {
  // Remove sensitive information from error messages
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /auth/gi
  ];

  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      sanitized = 'Authentication error occurred';
    }
  });

  return sanitized;
};

module.exports = {
  AppError,
  createError,
  asyncHandler,
  sendErrorDev,
  sendErrorProd,
  handleDatabaseErrors,
  handleJWTErrors,
  validateRequiredFields,
  sanitizeErrorMessage
};