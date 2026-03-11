const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true, default: 'Razorpay' },
    
    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refund_Pending', 'Refund_Processing', 'Refunded', 'Partial_Refunded', 'Refund_Failed', 'Held', 'Chargeback'],
      default: 'Pending',
    },
    paymentId: { type: String }, // Razorpay order ID
    receiptNumber: { type: String },
    
    // Order status tracking
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return_Initiated', 'Return_Approved', 'Return_Rejected', 'Returned'],
      default: 'Pending',
    },
    
    // Pricing
    itemsPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    discountApplied: { type: Number, default: 0.0 },
    couponCode: { type: String },
    totalPrice: { type: Number, required: true, default: 0.0 },
    
    // Refund tracking
    refundAmount: { type: Number, default: 0.0 },
    refundStatus: {
      type: String,
      enum: ['None', 'Pending', 'Processing', 'Completed', 'Failed'],
      default: 'None',
    },
    refundInitiatedAt: { type: Date },
    refundCompletedAt: { type: Date },
    refundTransactionId: { type: String },
    refundReason: { type: String },
    
    // Return tracking
    returnDeadlineAt: { type: Date },
    returnReason: { type: String },
    returnReasonCategory: {
      type: String,
      enum: ['defective', 'wrong_item', 'not_as_described', 'change_of_mind', 'better_price_found', 'other'],
    },
    returnInitiatedAt: { type: Date },
    returnPickupStatus: {
      type: String,
      enum: ['pending', 'scheduled', 'picked_up', 'cancelled'],
    },
    
    // Tax breakdown
    taxBreakdown: {
      CGST: { type: Number, default: 0 },
      SGST: { type: Number, default: 0 },
      IGST: { type: Number, default: 0 },
    },
    
    // Multi-vendor support
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vendorRevenueShare: { type: Number, default: 0.0 },
    platformCommission: { type: Number, default: 0.0 },
    
    // Timestamps
    processingStartedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelReasonCategory: { type: String },
    
    // Shipping
    trackingNumber: { type: String },
    isShipped: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },
    
    // Dispute handling
    disputeStatus: {
      type: String,
      enum: ['None', 'Initiated', 'Under_Review', 'Resolved', 'Appealed'],
      default: 'None',
    },
    chargebackInitiatedAt: { type: Date },
    disputeDescription: { type: String },
    
    // Legacy fields (for compatibility)
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      updateTime: { type: String },
      email: { type: String },
      receipt: { type: String },
    },
    
    // Audit Trail
    auditLog: [{
      action: String,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount: Number,
      transactionId: String,
      reason: String,
      description: String,
      timestamp: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
