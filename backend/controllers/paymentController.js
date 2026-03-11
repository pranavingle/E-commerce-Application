const Razorpay = require('razorpay');
const Order = require('../models/Order');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'lxB5xDUEH33SC1ZrTRq6I8XJ',
});

// @desc    Create payment order
// @route   POST /api/payment/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
  try {
    console.log('🔵 DEV_DIRECT_PAY env:', process.env.DEV_DIRECT_PAY);
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'Completed' || order.isPaid) {
      console.log('⚠️ Order already paid:', orderId);
      return res.status(400).json({ message: 'Order already paid' });
    }

    const isDevDirectPay = String(process.env.DEV_DIRECT_PAY || 'false').toLowerCase() === 'true';
    console.log('💳 DEV_DIRECT_PAY mode active:', isDevDirectPay);
    
    if (isDevDirectPay) {
      console.log('✅ Returning devDirectPay response for order:', order._id);
      return res.json({
        devDirectPay: true,
        orderId: order._id.toString(),
        amount: Math.round(order.totalPrice * 100),
        currency: 'INR',
      });
    }

    console.log('🌐 Creating Razorpay order for:', order._id);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100), // in paise
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: order.user.toString(),
      },
    });

    order.paymentId = razorpayOrder.id;
    await order.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
    });
  } catch (error) {
    const message = error?.error?.description || error?.message || 'Unable to create payment order';
    res.status(500).json({ message });
  }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify signature
    const hmac = crypto.createHmac(
      'sha256',
      process.env.RAZORPAY_KEY_SECRET || 'lxB5xDUEH33SC1ZrTRq6I8XJ'
    );
    hmac.update(`${order.paymentId}|${razorpayPaymentId}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpaySignature) {
      order.paymentStatus = 'Completed';
      order.orderStatus = 'Confirmed';
      order.isPaid = true;
      order.paidAt = new Date();
      order.receiptNumber = `RCPT-${order._id.toString().slice(-8).toUpperCase()}`;
      order.paymentResult = {
        id: razorpayPaymentId,
        status: 'captured',
        updateTime: new Date().toISOString(),
        email: order.user?.email || '',
        receipt: order.receiptNumber,
      };
      await order.save();

      console.log(`✅ Payment verified for order ${orderId}`);

      return res.json({
        success: true,
        message: 'Payment verified',
        order,
      });
    } else {
      order.paymentStatus = 'Failed';
      await order.save();
      return res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPaymentOrder, verifyPayment };
