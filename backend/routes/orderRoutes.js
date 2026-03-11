const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, createOrder).get(protect, admin, getAllOrders);
router.post('/restore-cancelled-stock', protect, admin, restoreCancelledStock);
router.get('/myorders', protect, getMyOrders);
router.get('/stats', protect, admin, getOrderStats);
router.get('/:id', protect, getOrderById);

// Payment & Order Status
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

// Refund Management
router.put('/:id/refund', protect, admin, initiateRefund);
router.put('/:id/refund/complete', protect, admin, completeRefund);

// Return Management
router.put('/:id/return', protect, initiateReturn);
router.put('/:id/return/approve', protect, admin, approveReturn);
router.put('/:id/return/reject', protect, admin, rejectReturn);

// Dispute Management
router.put('/:id/dispute', protect, admin, initiateDispute);

module.exports = router;
