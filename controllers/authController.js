const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createError, asyncHandler } = require('../utils/errorHandler');
const { generateTokenResponse } = require('../utils/tokenUtils');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, address, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createError('User with this email already exists', 409));
  }

  // Determine role - allow admin registration only in development or if no admin exists
  let userRole = 'user';

  if (role === 'admin') {
    // In development, allow admin registration
    if (process.env.NODE_ENV === 'development') {
      userRole = 'admin';
    } else {
      // In production, only allow admin registration if no admin exists
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        userRole = 'admin';
      }
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    role: userRole
  });

  // Generate tokens
  const tokenResponse = generateTokenResponse(user);

  // Update user with refresh token
  user.refreshToken = tokenResponse.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      ...tokenResponse
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(createError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(createError('Your account has been deactivated. Please contact support.', 401));
  }

  // Check password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    return next(createError('Invalid email or password', 401));
  }

  // Generate tokens
  const tokenResponse = generateTokenResponse(user);

  // Update user with refresh token and last login
  user.refreshToken = tokenResponse.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      },
      ...tokenResponse
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(createError('Refresh token is required', 400));
  }

  // Find user by refresh token
  const user = await User.findByRefreshToken(token);
  if (!user || user.refreshToken !== token) {
    return next(createError('Invalid refresh token', 401));
  }

  // Check if user is still active
  if (!user.isActive) {
    return next(createError('User account is deactivated', 401));
  }

  // Generate new tokens
  const tokenResponse = generateTokenResponse(user);

  // Update user with new refresh token
  user.refreshToken = tokenResponse.refreshToken;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: tokenResponse
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token from database
  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: null
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.matchPassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(createError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword
};