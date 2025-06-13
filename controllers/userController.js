const User = require('../models/User');
const { createError, asyncHandler } = require('../utils/errorHandler');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    role,
    isActive
  } = req.query;

  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limit);

  // Get users
  const users = await User.find(query)
    .select('-refreshToken')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (Own profile or Admin)
 */
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-refreshToken');

  if (!user) {
    return next(createError('User not found', 404));
  }

  // Check if user is accessing their own profile or is admin
  if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
    return next(createError('Access denied. You can only view your own profile.', 403));
  }

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
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private (Own profile or Admin)
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { name, phone, address, avatar } = req.body;
  
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(createError('User not found', 404));
  }

  // Check if user is updating their own profile or is admin
  if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
    return next(createError('Access denied. You can only update your own profile.', 403));
  }

  // Update fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (avatar !== undefined) updateData.avatar = avatar;

  // Only admin can update role and isActive
  if (req.user.role === 'admin') {
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
  }

  user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).select('-refreshToken');

  res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
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
 * @desc    Delete user account
 * @route   DELETE /api/users/:id
 * @access  Private (Own account or Admin)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(createError('User not found', 404));
  }

  // Check if user is deleting their own account or is admin
  if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
    return next(createError('Access denied. You can only delete your own account.', 403));
  }

  // Prevent admin from deleting their own account
  if (req.user.role === 'admin' && req.user._id.toString() === user._id.toString()) {
    return next(createError('Admin cannot delete their own account', 400));
  }

  // Soft delete: deactivate user instead of removing from database
  await User.findByIdAndUpdate(req.params.id, {
    isActive: false,
    refreshToken: null
  });

  res.status(200).json({
    success: true,
    message: 'User account deactivated successfully'
  });
});

/**
 * @desc    Activate/Deactivate user (Admin only)
 * @route   PATCH /api/users/:id/status
 * @access  Private/Admin
 */
const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return next(createError('isActive field must be a boolean value', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(createError('User not found', 404));
  }

  // Prevent admin from deactivating their own account
  if (req.user._id.toString() === user._id.toString()) {
    return next(createError('Admin cannot change their own account status', 400));
  }

  // Update user status
  user.isActive = isActive;
  if (!isActive) {
    user.refreshToken = null; // Clear refresh token if deactivating
  }
  await user.save();

  res.status(200).json({
    success: true,
    message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    }
  });
});

/**
 * @desc    Get user statistics (Admin only)
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactiveUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        },
        adminCount: {
          $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
        },
        userCount: {
          $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
        }
      }
    }
  ]);

  // Get users registered in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers: stats[0]?.totalUsers || 0,
      activeUsers: stats[0]?.activeUsers || 0,
      inactiveUsers: stats[0]?.inactiveUsers || 0,
      adminCount: stats[0]?.adminCount || 0,
      userCount: stats[0]?.userCount || 0,
      recentUsers
    }
  });
});

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats
};