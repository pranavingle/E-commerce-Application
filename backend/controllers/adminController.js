const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments({ orderStatus: { $ne: 'Cancelled' } });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

    // Revenue buckets based on order history.
    const revenueHistoryData = await Order.aggregate([
      {
        $group: {
          _id: null,
          grossRevenue: {
            $sum: {
              $cond: [
                { $ne: ['$orderStatus', 'Cancelled'] },
                '$totalPrice',
                0,
              ],
            },
          },
          pendingRevenue: {
            $sum: {
              $cond: [{ $eq: ['$orderStatus', 'Pending'] }, '$totalPrice', 0],
            },
          },
          confirmedRevenue: {
            $sum: {
              $cond: [
                { $in: ['$orderStatus', ['Confirmed', 'Processing', 'Shipped', 'Delivered']] },
                '$totalPrice',
                0,
              ],
            },
          },
          cancelledRevenue: {
            $sum: {
              $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, '$totalPrice', 0],
            },
          },
          paidRevenue: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'Completed'] },
                    { $eq: ['$isPaid', true] },
                  ],
                },
                '$totalPrice',
                0,
              ],
            },
          },
        },
      },
    ]);
    const revenueHistory = revenueHistoryData[0] || {};
    const grossRevenue = revenueHistory.grossRevenue || 0;
    const pendingRevenue = revenueHistory.pendingRevenue || 0;
    const confirmedRevenue = revenueHistory.confirmedRevenue || 0;
    const cancelledRevenue = revenueHistory.cancelledRevenue || 0;
    const paidRevenue = revenueHistory.paidRevenue || 0;

    // Net Revenue (paid orders - refunds - cancelled)
    // Uses $or to be backward-compatible with old orders that don't have refundStatus field
    const netRevenueData = await Order.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ paymentStatus: 'Completed' }, { isPaid: true }] },
            { orderStatus: { $ne: 'Cancelled' } },
            { paymentStatus: { $ne: 'Refunded' } },
            { paymentStatus: { $ne: 'Partial_Refunded' } },
            { $or: [{ refundStatus: 'None' }, { refundStatus: { $exists: false } }] }
          ]
        },
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const netRevenue = netRevenueData[0]?.total || 0;

    // Total Refunds
    const totalRefundsData = await Order.aggregate([
      {
        $match: {
          refundAmount: { $gt: 0 }
        },
      },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]);
    const totalRefunds = totalRefundsData[0]?.total || 0;

    // Pending Refunds
    const pendingRefundsData = await Order.aggregate([
      {
        $match: {
          refundStatus: { $in: ['Pending', 'Processing'] }
        },
      },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]);
    const pendingRefunds = pendingRefundsData[0]?.total || 0;

    const revenueLossData = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $gt: ['$refundAmount', 0] },
                '$refundAmount',
                {
                  $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, '$totalPrice', 0],
                },
              ],
            },
          },
        },
      },
    ]);
    const revenueLoss = revenueLossData[0]?.total || 0;

    // Payment Failures
    const paymentFailures = await Order.countDocuments({ paymentStatus: 'Failed' });

    // Active Disputes/Chargebacks
    const activeDisputes = await Order.countDocuments({ disputeStatus: { $in: ['Initiated', 'Under_Review'] } });

    // Orders by Status Breakdown
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Pending Orders
    const pendingOrders = await Order.countDocuments({ 
      orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] }
    });

    // Delivered Orders
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });

    // Return Initiated
    const returnsInitiated = await Order.countDocuments({ 
      returnInitiatedAt: { $exists: true, $ne: null } 
    });

    // Inactive users (computed before res.json)
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const topProducts = await Product.find({}).sort({ numReviews: -1 }).limit(5);
    
    res.json({
      // User metrics
      totalUsers,
      totalSellers,
      inactiveUsers,
      
      // Product metrics
      totalProducts,
      
      // Order metrics
      totalOrders,
      cancelledOrders,
      pendingOrders,
      deliveredOrders,
      returnsInitiated,
      ordersByStatus,
      
      // Revenue metrics
      grossRevenue,
      paidRevenue,
      pendingRevenue,
      confirmedRevenue,
      cancelledRevenue,
      netRevenue,
      totalRefunds,
      pendingRefunds,
      revenueLoss,
      
      // Payment metrics
      paymentFailures,
      
      // Dispute metrics
      activeDisputes,
      
      // Health Indicators
      cancellationRate: totalOrders > 0 ? ((cancelledOrders / (totalOrders + cancelledOrders)) * 100).toFixed(2) : 0,
      returnRate: deliveredOrders > 0 ? ((returnsInitiated / deliveredOrders) * 100).toFixed(2) : 0,
      refundSuccessRate: totalRefunds > 0 ? (((totalRefunds - pendingRefunds) / totalRefunds) * 100).toFixed(2) : 100,
      
      recentOrders,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getDashboardStats };
