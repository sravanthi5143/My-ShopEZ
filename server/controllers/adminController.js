const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['customer', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Please provide a valid role (customer or admin)' });
      return;
    }

    const user = await User.findById(req.params.id);

    if (user) {
      user.role = role;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('orderItems.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});

    const orders = await Order.find({});
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rich dashboard database analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalyticsStats = async (req, res) => {
  try {
    // 1. Total counts
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});

    const allOrders = await Order.find({});
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    // 2. Monthly Sales (grouping past 12 months)
    const monthlySales = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlySales = monthlySales.map(item => {
      const monthIndex = item._id.month - 1;
      const monthLabel = monthIndex >= 0 && monthIndex < 12 ? monthNames[monthIndex] : `M${item._id.month}`;
      return {
        month: monthLabel,
        sales: Number(item.sales.toFixed(2)),
        count: item.count
      };
    });

    // 3. Category Sales
    const categorySales = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          value: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          salesCount: { $sum: '$orderItems.quantity' }
        }
      },
      { $project: { name: '$_id', value: { $round: ['$value', 2] }, salesCount: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    // 4. Best Sellers (Top Selling Products)
    const bestSellers = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          revenue: { $round: ['$revenue', 2] },
          name: '$productDetails.name',
          brand: '$productDetails.brand',
          category: '$productDetails.category',
          image: '$productDetails.image',
          rating: '$productDetails.rating',
          numReviews: '$productDetails.numReviews'
        }
      }
    ]);

    // 5. Top Brands
    const topBrands = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.brand',
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      { $project: { brand: '$_id', totalSold: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // 6. Top Customers
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          totalSpent: { $round: ['$totalSpent', 2] },
          ordersCount: 1,
          name: '$userDetails.name',
          email: '$userDetails.email'
        }
      }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      monthlySales: formattedMonthlySales,
      categorySales,
      bestSellers,
      topBrands,
      topCustomers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all admin notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAdminNotifications = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Private/Admin
const markNotificationRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.isRead = true;
    await notification.save();
    
    // Broadcast update
    if (req.app.get('io')) {
      req.app.get('io').emit('admin-notification-read', req.params.id);
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/admin/notifications/read-all
// @access  Private/Admin
const markAllNotificationsRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.updateMany({ isRead: false }, { isRead: true });
    
    // Broadcast update
    if (req.app.get('io')) {
      req.app.get('io').emit('admin-notifications-read-all');
    }
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private/Admin
const deleteNotification = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.findByIdAndDelete(req.params.id);
    
    // Broadcast update
    if (req.app.get('io')) {
      req.app.get('io').emit('admin-notification-deleted', req.params.id);
    }
    
    res.json({ message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to create notification and emit socket event
const createAdminNotification = async (req, title, message, type = 'info', link = null, relatedId = null) => {
  try {
    const Notification = require('../models/Notification');
    const notification = await Notification.create({
      title,
      message,
      type,
      link,
      relatedId
    });
    
    if (req && req.app.get('io')) {
      req.app.get('io').emit('new-admin-notification', notification);
      req.app.get('io').emit('dashboard-update'); // Tell dashboard to refresh data
    }
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllOrders,
  getDashboardStats,
  getAnalyticsStats,
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createAdminNotification
};
