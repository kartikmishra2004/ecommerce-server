const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/errorHandler');

/**
 * Middleware to protect routes - requires valid JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(createError('Access denied. No token provided.', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(createError('User not found. Token is invalid.', 401));
      }

      if (!user.isActive) {
        return next(createError('User account is deactivated.', 401));
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(createError('Token expired. Please login again.', 401));
      } else if (error.name === 'JsonWebTokenError') {
        return next(createError('Invalid token. Please login again.', 401));
      } else {
        return next(createError('Token verification failed.', 401));
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Access denied. User not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError(
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        403
      ));
    }

    next();
  };
};

/**
 * Middleware for optional authentication
 * Sets req.user if token is valid, but doesn't block if token is missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const ownerOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Access denied. User not authenticated.', 401));
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource ? req.resource[resourceUserField] : req.params.userId;
    
    if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
      return next();
    }

    return next(createError('Access denied. You can only access your own resources.', 403));
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  ownerOrAdmin
};