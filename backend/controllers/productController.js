const Product = require('../models/Product');
const Review = require('../models/Review');
const { toNonNegativeNumber, validateProductPayload } = require('../utils/requestValidators');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

    const query = {};
    if (keyword) query.$text = { $search: keyword };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { ratings: -1 };
    else sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('seller', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const reviews = await Review.find({ product: product._id }).populate('user', 'name avatar');
    res.json({ product, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Seller/Admin
const createProduct = async (req, res) => {
  try {
    const validationError = validateProductPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, description, price, discountPrice, category, brand, stock, images, tags, isFeatured } = req.body;
    const product = await Product.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: toNonNegativeNumber(price),
      discountPrice: toNonNegativeNumber(discountPrice) || 0,
      category: String(category).trim(),
      brand,
      stock: toNonNegativeNumber(stock),
      images: images || [],
      tags: tags || [],
      seller: req.user.id,
      isFeatured: isFeatured || false,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Seller/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = { ...req.body };
    if (updates.price !== undefined) {
      const parsedPrice = toNonNegativeNumber(updates.price);
      if (parsedPrice === null) {
        return res.status(400).json({ message: 'Price must be a valid non-negative number' });
      }
      updates.price = parsedPrice;
    }
    if (updates.discountPrice !== undefined) {
      const parsedDiscountPrice = toNonNegativeNumber(updates.discountPrice);
      if (parsedDiscountPrice === null) {
        return res.status(400).json({ message: 'Discount price must be a valid non-negative number' });
      }
      updates.discountPrice = parsedDiscountPrice;
    }
    if (updates.stock !== undefined) {
      const parsedStock = toNonNegativeNumber(updates.stock);
      if (parsedStock === null) {
        return res.status(400).json({ message: 'Stock must be a valid non-negative number' });
      }
      updates.stock = parsedStock;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Seller/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).limit(8).populate('seller', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller's products
// @route   GET /api/products/seller
// @access  Private/Seller
const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add review
// @route   POST /api/products/:id/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const alreadyReviewed = await Review.findOne({ product: req.params.id, user: req.user.id });
    if (alreadyReviewed) return res.status(400).json({ message: 'Product already reviewed' });

    const review = await Review.create({
      product: req.params.id,
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });

    const reviews = await Review.find({ product: req.params.id });
    product.numReviews = reviews.length;
    product.ratings = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await product.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getFeaturedProducts, getSellerProducts, addReview };
