const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getSellerProducts,
  addReview,
} = require('../controllers/productController');
const { protect, seller } = require('../middleware/authMiddleware');

router.get('/featured', getFeaturedProducts);
router.get('/seller', protect, seller, getSellerProducts);
router.route('/').get(getProducts).post(protect, seller, createProduct);
router.route('/:id').get(getProductById).put(protect, seller, updateProduct).delete(protect, seller, deleteProduct);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
