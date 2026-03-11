/**
 * Return Window Service
 * Handles return eligibility checks and return window calculations
 */

// Return window: 30 days from delivery
const RETURN_DAYS = 30;

/**
 * Check if order is eligible for return
 * @param {Object} order - Order object from database
 * @returns {Object} { eligible: boolean, reason: string, daysRemaining: number }
 */
const isEligibleForReturn = (order) => {
  // Must be delivered
  if (order.orderStatus !== 'Delivered') {
    return {
      eligible: false,
      reason: `Order must be delivered. Current status: ${order.orderStatus}`,
      daysRemaining: 0
    };
  }

  // Must have delivery date
  if (!order.deliveredAt) {
    return {
      eligible: false,
      reason: 'Delivery date not recorded',
      daysRemaining: 0
    };
  }

  // Check return window
  const deliveryDate = new Date(order.deliveredAt);
  const returnDeadline = new Date(deliveryDate);
  returnDeadline.setDate(returnDeadline.getDate() + RETURN_DAYS);
  
  const currentDate = new Date();
  const daysRemaining = Math.ceil((returnDeadline - currentDate) / (1000 * 3600 * 24));

  if (currentDate > returnDeadline) {
    return {
      eligible: false,
      reason: `Return window expired. ${Math.abs(daysRemaining)} days ago`,
      daysRemaining: 0,
      returnDeadline: returnDeadline.toISOString()
    };
  }

  // Check if already returned/return initiated
  if (['Return_Initiated', 'Return_Approved', 'Returned'].includes(order.orderStatus)) {
    return {
      eligible: false,
      reason: 'Return already initiated for this order',
      daysRemaining,
      returnDeadline: returnDeadline.toISOString()
    };
  }

  // Check forbidden categories (electronics frequently returned)
  const nonReturnableCategories = ['subscription', 'digital', 'used'];
  if (nonReturnableCategories.some(cat => order.orderItems?.some(item => item.category?.toLowerCase().includes(cat)))) {
    return {
      eligible: false,
      reason: 'Some items in this order are not eligible for return',
      daysRemaining,
      returnDeadline: returnDeadline.toISOString()
    };
  }

  return {
    eligible: true,
    reason: 'Order is eligible for return',
    daysRemaining,
    returnDeadline: returnDeadline.toISOString()
  };
};

/**
 * Calculate refund amount based on return reason
 * @param {Object} order - Order object
 * @param {string} returnReason - Reason for return
 * @returns {Object} { refundAmount: number, deductions: {...} }
 */
const calculateRefundAmount = (order, returnReason) => {
  let refundAmount = order.totalPrice;
  const deductions = {
    shipping: 0,
    restockingFee: 0
  };

  // Deduct shipping if customer initiated return (not defective/wrong item)
  if (!['defective', 'wrong_item', 'not_as_described'].includes(returnReason)) {
    deductions.shipping = order.shippingPrice;
    refundAmount -= order.shippingPrice;
  }

  // Restocking fee for change of mind (10% for new sellers allowed, 5% established)
  if (returnReason === 'change_of_mind') {
    const restockingFee = order.itemsPrice * 0.05; // 5% default
    deductions.restockingFee = restockingFee;
    refundAmount -= restockingFee;
  }

  return {
    refundAmount: Math.max(0, refundAmount),
    deductions,
    originalAmount: order.totalPrice
  };
};

/**
 * Get return window deadline for an order
 * @param {Object} order - Order object
 * @returns {Date} Return deadline date
 */
const getReturnDeadline = (order) => {
  if (!order.deliveredAt) return null;
  
  const deadline = new Date(order.deliveredAt);
  deadline.setDate(deadline.getDate() + RETURN_DAYS);
  return deadline;
};

/**
 * Get days remaining for return
 * @param {Object} order - Order object
 * @returns {number} Days remaining (negative if expired)
 */
const getDaysRemaining = (order) => {
  const deadline = getReturnDeadline(order);
  if (!deadline) return 0;
  
  const remaining = Math.ceil((deadline - new Date()) / (1000 * 3600 * 24));
  return remaining;
};

/**
 * Validate return request
 * @param {Object} order - Order object
 * @param {Object} returnData - Return request data { returnReason, returnReasonCategory }
 * @returns {Object} { valid: boolean, errors: [] }
 */
const validateReturnRequest = (order, returnData) => {
  const errors = [];

  // Check eligibility
  const eligibility = isEligibleForReturn(order);
  if (!eligibility.eligible) {
    errors.push(eligibility.reason);
  }

  // Validate reason provided
  if (!returnData.returnReason || returnData.returnReason.trim().length === 0) {
    errors.push('Return reason is required');
  }

  // Validate reason category
  const validCategories = ['defective', 'wrong_item', 'not_as_described', 'change_of_mind', 'better_price_found', 'other'];
  if (!validCategories.includes(returnData.returnReasonCategory)) {
    errors.push(`Invalid return reason category. Must be one of: ${validCategories.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  isEligibleForReturn,
  calculateRefundAmount,
  getReturnDeadline,
  getDaysRemaining,
  validateReturnRequest,
  RETURN_DAYS
};
