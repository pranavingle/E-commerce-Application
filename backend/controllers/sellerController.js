const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get seller's confirmed orders
// @route   GET /api/seller/orders
// @access  Private/Seller
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get all products by seller
    const sellerProducts = await Product.find({ seller: sellerId });
    const productIds = sellerProducts.map(p => p._id);

    // Get orders containing seller's products with confirmed payment
    const orders = await Order.find({
      'orderItems.product': { $in: productIds },
      $or: [{ paymentStatus: 'Completed' }, { isPaid: true }],
    })
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name price image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller dashboard stats
// @route   GET /api/seller/stats
// @access  Private/Seller
const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const products = await Product.find({ seller: sellerId }).select('_id stock ratings numReviews price discountPrice');
    const productIds = products.map((product) => product._id);

    const orders = await Order.find({
      'orderItems.product': { $in: productIds },
    }).select('totalPrice orderStatus paymentStatus isPaid');

    const paidOrders = orders.filter((order) => order.paymentStatus === 'Completed' || order.isPaid);
    const activeOrders = orders.filter((order) => order.orderStatus !== 'Cancelled');

    const stats = {
      totalProducts: products.length,
      inStockProducts: products.filter((product) => product.stock > 0).length,
      outOfStockProducts: products.filter((product) => product.stock <= 0).length,
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      paidOrders: paidOrders.length,
      totalRevenue: paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
      averageRating: products.length
        ? Number((products.reduce((sum, product) => sum + (product.ratings || 0), 0) / products.length).toFixed(1))
        : 0,
      totalReviews: products.reduce((sum, product) => sum + (product.numReviews || 0), 0),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (seller can process/ship)
// @route   PUT /api/seller/orders/:orderId/status
// @access  Private/Seller
const updateOrderStatusSeller = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, trackingNumber } = req.body;
    const sellerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller owns this order's products
    const sellerProducts = await Product.find({ seller: sellerId });
    const productIds = sellerProducts.map(p => p._id.toString());

    const isSellerOrder = order.orderItems.some(item =>
      productIds.includes(item.product.toString())
    );

    if (!isSellerOrder) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Seller can only move to Processing or Shipped
    if (orderStatus === 'Processing') {
      order.orderStatus = 'Processing';
    } else if (orderStatus === 'Shipped') {
      order.orderStatus = 'Shipped';
      order.isShipped = true;
      order.shippedAt = new Date();
      order.trackingNumber = trackingNumber || `SHOP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    } else {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSellerOrders, getSellerStats, updateOrderStatusSeller };
