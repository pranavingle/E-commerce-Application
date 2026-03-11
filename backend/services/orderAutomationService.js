const cron = require('node-cron');
const Order = require('../models/Order');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// Send email helper
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopez.com',
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
};

// Auto-move: Confirmed → Processing (after 2 minutes)
const automateOrderProcessing = () => {
  cron.schedule('*/2 * * * *', async () => {
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      const orders = await Order.find({
        orderStatus: 'Confirmed',
        $or: [{ paymentStatus: 'Completed' }, { isPaid: true }],
        createdAt: { $lte: twoMinutesAgo },
      }).populate('user', 'email name');

      for (let order of orders) {
        order.orderStatus = 'Processing';
        order.processingStartedAt = new Date();
        await order.save();

        // Send email
        if (order.user?.email) {
          await sendEmail(
            order.user.email,
            '📦 Your Order is Being Processed',
            `
              <h2 style="color: #e44d26;">Order #${order._id.toString().slice(-6).toUpperCase()}</h2>
              <p>Hi ${order.user.name},</p>
              <p>Your order is now being processed and will be shipped soon!</p>
              <p><strong>Order Total:</strong> ₹${order.totalPrice}</p>
              <p>Track your order at: <a href="http://localhost:3000/orders/${order._id}">View Order</a></p>
              <br/>
              <p>Thank you for shopping with ShopEZ!</p>
            `
          );
        }

        console.log(`✅ Order ${order._id} moved to Processing`);
      }
    } catch (error) {
      console.error('❌ Processing automation error:', error.message);
    }
  });
};

// Auto-move: Processing → Shipped (after 5 minutes)
const automateOrderShipping = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const orders = await Order.find({
        orderStatus: 'Processing',
        processingStartedAt: { $lte: fiveMinutesAgo },
      }).populate('user', 'email name');

      for (let order of orders) {
        order.orderStatus = 'Shipped';
        order.shippedAt = new Date();
        order.isShipped = true;
        order.trackingNumber = `SHOP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        await order.save();

        // Send email
        if (order.user?.email) {
          await sendEmail(
            order.user.email,
            '🚚 Your Order Has Shipped!',
            `
              <h2 style="color: #e44d26;">Order #${order._id.toString().slice(-6).toUpperCase()}</h2>
              <p>Hi ${order.user.name},</p>
              <p>Great news! Your order has shipped and is on its way to you!</p>
              <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
              <p><strong>Expected Delivery:</strong> In 3-5 business days</p>
              <p>Track your shipment: <a href="http://localhost:3000/orders/${order._id}">View Order</a></p>
              <br/>
              <p>Thank you for shopping with ShopEZ!</p>
            `
          );
        }

        console.log(`✅ Order ${order._id} moved to Shipped (Tracking: ${order.trackingNumber})`);
      }
    } catch (error) {
      console.error('❌ Shipping automation error:', error.message);
    }
  });
};

// Auto-move: Shipped → Delivered (after 8 minutes)
const automateOrderDelivery = () => {
  cron.schedule('*/8 * * * *', async () => {
    try {
      const eightMinutesAgo = new Date(Date.now() - 8 * 60 * 1000);

      const orders = await Order.find({
        orderStatus: 'Shipped',
        shippedAt: { $lte: eightMinutesAgo },
      }).populate('user', 'email name');

      for (let order of orders) {
        order.orderStatus = 'Delivered';
        order.deliveredAt = new Date();
        order.isDelivered = true;
        await order.save();

        // Send email
        if (order.user?.email) {
          await sendEmail(
            order.user.email,
            '✅ Your Order Has Been Delivered!',
            `
              <h2 style="color: #28a745;">Order #${order._id.toString().slice(-6).toUpperCase()}</h2>
              <p>Hi ${order.user.name},</p>
              <p>Your order has been delivered successfully! 🎉</p>
              <p><strong>Delivery Date:</strong> ${new Date(order.deliveredAt).toLocaleDateString()}</p>
              <p>We would love to hear from you! Please rate your experience and leave a review.</p>
              <p>Visit: <a href="http://localhost:3000/orders/${order._id}">Leave a Review</a></p>
              <br/>
              <p>Thank you for shopping with ShopEZ!</p>
            `
          );
        }

        console.log(`✅ Order ${order._id} moved to Delivered`);
      }
    } catch (error) {
      console.error('❌ Delivery automation error:', error.message);
    }
  });
};

// Start all automations
const startOrderAutomation = () => {
  console.log('🤖 Order automation system started...');
  automateOrderProcessing();
  automateOrderShipping();
  automateOrderDelivery();
  console.log('✅ All automation jobs initialized');
};

module.exports = { startOrderAutomation };
