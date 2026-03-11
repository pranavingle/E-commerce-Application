const express = require('express');
const { getSellerOrders, getSellerStats, updateOrderStatusSeller } = require('../controllers/sellerController');
const { protect, seller } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, seller, getSellerStats);
router.get('/orders', protect, seller, getSellerOrders);
router.put('/orders/:orderId/status', protect, seller, updateOrderStatusSeller);

module.exports = router;
