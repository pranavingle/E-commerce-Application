const Order = require('../models/Order');
const Product = require('../models/Product');
const { toNonNegativeNumber, validateOrderPayload } = require('../utils/requestValidators');

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();
  const mapping = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return mapping[value] || null;
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const validationError = validateOrderPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;

    // Update stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      itemsPrice: toNonNegativeNumber(itemsPrice),
      shippingPrice: toNonNegativeNumber(shippingPrice),
      taxPrice: toNonNegativeNumber(taxPrice),
      totalPrice: toNonNegativeNumber(totalPrice),
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'Completed';
    order.orderStatus = 'Confirmed';
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      updateTime: req.body.update_time,
      email: req.body.payer?.email_address,
    };
    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel own order (Like Flipkart/Amazon)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    // Fetch order without populate first to ensure we have the order
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    console.log('🔵 Cancel request for order:', req.params.id);
    console.log('📦 Order Status:', order.orderStatus || 'Pending');

    const isOwner = order.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      console.log('❌ Authorization failed');
      return res.status(403).json({ message: 'Not authorized' });
    }

    const currentStatus = order.orderStatus || 'Pending';
    if (currentStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }
    
    // Like Flipkart/Amazon: Only allow cancellation before shipping
    if (['Shipped', 'Delivered'].includes(currentStatus)) {
      console.log('❌ Cannot cancel shipped/delivered order:', currentStatus);
      return res.status(400).json({ 
        message: `Cannot cancel order that is ${currentStatus}. Please contact support for returns.` 
      });
    }

    console.log('🔄 Starting stock restoration for', order.orderItems.length, 'items');

    // Restore stock - handle both populated and non-populated product references
    const Product = require('../models/Product');
    let restoredCount = 0;
    let skippedCount = 0;
    const restorationDetails = [];

    for (const item of order.orderItems) {
      try {
        // Extract product ID (works with both ObjectId and populated object)
        const productId = item.product?._id || item.product;
        
        if (!productId) {
          console.log('⚠️ Skipped: Product reference is missing for item:', item.name);
          skippedCount++;
          restorationDetails.push({ item: item.name, status: 'skipped', reason: 'No product ID' });
          continue;
        }

        // Restore stock using atomic operation
        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { $inc: { stock: item.quantity } },
          { new: true, runValidators: true }
        );

        if (updatedProduct) {
          console.log(`✅ Restored ${item.quantity}x "${item.name}" (ID: ${productId}), new stock: ${updatedProduct.stock}`);
          restoredCount++;
          restorationDetails.push({ 
            item: item.name, 
            quantity: item.quantity,
            status: 'restored', 
            newStock: updatedProduct.stock 
          });
        } else {
          console.log(`⚠️ Product "${item.name}" (ID: ${productId}) not found in database`);
          skippedCount++;
          restorationDetails.push({ item: item.name, status: 'skipped', reason: 'Product not found' });
        }
      } catch (itemError) {
        console.log(`❌ Error restoring stock for "${item.name}":`, itemError.message);
        skippedCount++;
        restorationDetails.push({ item: item.name, status: 'error', reason: itemError.message });
      }
    }

    console.log(`📊 Stock restoration complete: ${restoredCount} restored, ${skippedCount} skipped`);

    // Update order status
    order.orderStatus = 'Cancelled';
    if (order.paymentStatus === 'Completed' || order.isPaid) {
      order.paymentStatus = 'Refunded';
    }
    
    // Add cancellation metadata
    order.cancelledAt = new Date();
    order.cancelledBy = req.user.id;

    const updated = await order.save();
    console.log('✅ Order cancelled successfully:', order._id);
    
    res.json({
      ...updated.toObject(),
      stockRestorationSummary: {
        restored: restoredCount,
        skipped: skippedCount,
        details: restorationDetails
      }
    });
  } catch (error) {
    console.log('❌ Cancel order error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const normalizedStatus = normalizeStatus(req.body.status);
    if (!normalizedStatus) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    order.orderStatus = normalizedStatus;
    if (normalizedStatus === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    if (normalizedStatus === 'Shipped') {
      order.isShipped = true;
      if (!order.shippedAt) {
        order.shippedAt = Date.now();
      }
    }
    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order stats (Admin)
// @route   GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          $or: [{ paymentStatus: 'Completed' }, { isPaid: true }],
        },
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$orderStatus', 'Pending'] },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusCounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restore stock for already-cancelled orders (Utility/Admin)
// @route   POST /api/orders/restore-cancelled-stock
// @access  Private/Admin
const restoreCancelledStock = async (req, res) => {
  try {
    console.log('🔧 Starting bulk stock restoration for cancelled orders...');
    
    // Find all cancelled orders
    const cancelledOrders = await Order.find({ 
      orderStatus: 'Cancelled' 
    }).select('_id orderItems orderStatus createdAt');

    console.log(`📦 Found ${cancelledOrders.length} cancelled orders`);

    const Product = require('../models/Product');
    let totalRestored = 0;
    let totalSkipped = 0;
    let totalOrders = 0;
    const processedOrders = [];

    for (const order of cancelledOrders) {
      totalOrders++;
      let orderRestored = 0;
      let orderSkipped = 0;
      
      console.log(`\n🔄 Processing order ${order._id}...`);

      for (const item of order.orderItems) {
        try {
          const productId = item.product?._id || item.product;
          
          if (!productId) {
            console.log(`  ⚠️ Skipped "${item.name}": No product ID`);
            orderSkipped++;
            continue;
          }

          const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $inc: { stock: item.quantity } },
            { new: true }
          );

          if (updatedProduct) {
            console.log(`  ✅ Restored ${item.quantity}x "${item.name}", new stock: ${updatedProduct.stock}`);
            orderRestored++;
            totalRestored++;
          } else {
            console.log(`  ⚠️ Product "${item.name}" not found`);
            orderSkipped++;
            totalSkipped++;
          }
        } catch (err) {
          console.log(`  ❌ Error for "${item.name}":`, err.message);
          orderSkipped++;
          totalSkipped++;
        }
      }

      processedOrders.push({
        orderId: order._id,
        itemsRestored: orderRestored,
        itemsSkipped: orderSkipped,
        date: order.createdAt
      });
    }

    console.log(`\n✅ Bulk restoration complete!`);
    console.log(`   Orders processed: ${totalOrders}`);
    console.log(`   Items restored: ${totalRestored}`);
    console.log(`   Items skipped: ${totalSkipped}`);

    res.json({
      success: true,
      summary: {
        ordersProcessed: totalOrders,
        itemsRestored: totalRestored,
        itemsSkipped: totalSkipped
      },
      orders: processedOrders
    });
  } catch (error) {
    console.log('❌ Bulk restoration error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Initiate refund for order (Admin)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
const initiateRefund = async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only refund completed/delivered orders
    if (!['Completed', 'Delivered'].includes(order.paymentStatus) && !order.isPaid) {
      return res.status(400).json({ message: 'Only paid orders can be refunded' });
    }

    if (order.refundStatus === 'Processing' || order.refundStatus === 'Completed') {
      return res.status(400).json({ message: 'Refund already in progress or completed' });
    }

    const refundAmt = refundAmount || order.totalPrice;
    if (refundAmt > order.totalPrice) {
      return res.status(400).json({ message: `Refund amount cannot exceed order total (₹${order.totalPrice})` });
    }

    // Calculate tax proportionally for partial refunds
    const refundProportion = refundAmt / order.totalPrice;
    const taxRefund = order.taxPrice * refundProportion;

    order.refundAmount = refundAmt;
    order.refundStatus = 'Pending';
    order.refundInitiatedAt = new Date();
    order.refundReason = refundReason || 'Customer requested';
    
    // Update payment status
    if (refundAmt === order.totalPrice) {
      order.paymentStatus = 'Refund_Pending';
    } else {
      order.paymentStatus = 'Partial_Refunded';
    }

    // Log audit
    order.auditLog = order.auditLog || [];
    order.auditLog.push({
      action: 'refund_initiated',
      by: req.user.id,
      amount: refundAmt,
      timestamp: new Date(),
      reason: refundReason,
    });

    const updated = await order.save();
    res.json({
      message: 'Refund initiated',
      order: updated,
      refundDetails: {
        amount: refundAmt,
        taxRefund: taxRefund,
        status: 'Pending',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete refund for order (Admin)
// @route   PUT /api/orders/:id/refund/complete
// @access  Private/Admin
const completeRefund = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.refundStatus !== 'Pending' && order.refundStatus !== 'Processing') {
      return res.status(400).json({ message: 'No pending refund for this order' });
    }

    order.refundStatus = 'Completed';
    order.refundCompletedAt = new Date();
    order.refundTransactionId = transactionId;
    
    if (order.refundAmount === order.totalPrice) {
      order.paymentStatus = 'Refunded';
    } else {
      order.paymentStatus = 'Partial_Refunded';
    }

    order.auditLog = order.auditLog || [];
    order.auditLog.push({
      action: 'refund_completed',
      by: req.user.id,
      transactionId: transactionId,
      timestamp: new Date(),
    });

    const updated = await order.save();
    res.json({ message: 'Refund completed successfully', order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Initiate return for delivered order (User)
// @route   PUT /api/orders/:id/return
// @access  Private
const initiateReturn = async (req, res) => {
  try {
    const { returnReason, returnReasonCategory } = req.body;
    const returnWindowService = require('../services/returnWindowService');
    
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check authorization
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Validate return request
    const validation = returnWindowService.validateReturnRequest(order, { returnReason, returnReasonCategory });
    if (!validation.valid) {
      return res.status(400).json({ 
        message: 'Return request validation failed',
        errors: validation.errors 
      });
    }

    // Check eligibility
    const eligibility = returnWindowService.isEligibleForReturn(order);
    if (!eligibility.eligible) {
      return res.status(400).json({ message: eligibility.reason });
    }

    // Calculate refund amount based on reason
    const refundCalc = returnWindowService.calculateRefundAmount(order, returnReasonCategory);
    const returnDeadline = returnWindowService.getReturnDeadline(order);

    order.orderStatus = 'Return_Initiated';
    order.returnReason = returnReason;
    order.returnReasonCategory = returnReasonCategory;
    order.returnInitiatedAt = new Date();
    order.returnDeadlineAt = returnDeadline;
    order.refundAmount = refundCalc.refundAmount;

    order.auditLog = order.auditLog || [];
    order.auditLog.push({
      action: 'return_initiated',
      by: req.user.id,
      reason: returnReason,
      reasonCategory: returnReasonCategory,
      estimatedRefund: refundCalc.refundAmount,
      deductions: refundCalc.deductions,
      timestamp: new Date(),
    });

    const updated = await order.save();
    res.json({ 
      message: 'Return initiated successfully',
      order: updated,
      refundEstimate: {
        originalAmount: refundCalc.originalAmount,
        estimatedRefund: refundCalc.refundAmount,
        deductions: refundCalc.deductions
      },
      nextSteps: 'Await seller approval and pickup scheduling'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve return and schedule pickup (Seller/Admin)
// @route   PUT /api/orders/:id/return/approve
// @access  Private/Admin
const approveReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.orderStatus !== 'Return_Initiated') {
      return res.status(400).json({ message: 'No pending return request' });
    }

    order.orderStatus = 'Return_Approved';
    order.returnPickupStatus = 'scheduled';
    
    order.auditLog = order.auditLog || [];
    order.auditLog.push({
      action: 'return_approved',
      by: req.user.id,
      timestamp: new Date(),
    });

    const updated = await order.save();
    res.json({ message: 'Return approved. Pickup will be scheduled.', order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject return (Seller/Admin)
// @route   PUT /api/orders/:id/return/reject
// @access  Private/Admin
const rejectReturn = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.orderStatus !== 'Return_Initiated') {
      return res.status(400).json({ message: 'No pending return request' });
    }

    order.orderStatus = 'Return_Rejected';
    
    order.auditLog = order.auditLog || [];
    order.auditLog.push({
      action: 'return_rejected',
      by: req.user.id,
      reason: rejectionReason,
      timestamp: new Date(),
    });

    const updated = await order.save();
    res.json({ message: 'Return rejected', order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Initiate chargeback/dispute (Admin)
// @route   PUT /api/orders/:id/dispute
// @access  Private/Admin
const initiateDispute = async (req, res) => {
  try {
    const { disputeDescription } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.disputeStatus = 'Initiated';
    order.chargebackInitiatedAt = new Date();
    order.disputeDescription = disputeDescription;
    order.paymentStatus = 'Held';

    order.auditLog = order.auditLog || [];
    order.auditLog.push({
      action: 'dispute_initiated',
      by: req.user.id,
      description: disputeDescription,
      timestamp: new Date(),
    });

    const updated = await order.save();
    res.json({ message: 'Dispute initiated', order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderStats,
  restoreCancelledStock,
  initiateRefund,
  completeRefund,
  initiateReturn,
  approveReturn,
  rejectReturn,
  initiateDispute,
};
