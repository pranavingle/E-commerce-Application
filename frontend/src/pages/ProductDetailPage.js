import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, addReview } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { FiStar, FiShoppingCart, FiArrowLeft, FiPackage, FiShield, FiTruck } from 'react-icons/fi';

const StarRating = ({ rating, interactive = false, onRate }) => (
  <div className="d-flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <FiStar
        key={s}
        size={interactive ? 22 : 16}
        style={{ cursor: interactive ? 'pointer' : 'default', color: s <= Math.round(rating) ? '#ffc107' : '#e0e0e0' }}
        fill={s <= Math.round(rating) ? '#ffc107' : 'none'}
        onClick={() => interactive && onRate && onRate(s)}
      />
    ))}
  </div>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    getProductById(id)
      .then(({ data }) => {
        setProduct(data.product);
        setReviews(data.reviews || []);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!product) return (
    <div className="container py-5 text-center">
      <h3>Product not found</h3>
      <button className="btn btn-danger mt-3" onClick={() => navigate('/products')}>Back to Products</button>
    </div>
  );

  const discountPercent = product.discountPrice && product.discountPrice < product.price
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  const handleAddToCart = () => {
    addToCart({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      discountPrice: product.discountPrice || product.price,
      stock: product.stock,
      quantity,
    });
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    setSubmittingReview(true);
    try {
      const { data } = await addReview(id, { rating: reviewRating, comment: reviewComment });
      setReviews(prev => [...prev, data]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none p-0 mb-3" onClick={() => navigate(-1)}>
        <FiArrowLeft className="me-1" /> Back
      </button>

      <div className="row g-4">
        {/* Product Images */}
        <div className="col-md-5">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            {product.images?.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="card-img-top"
                style={{ height: 400, objectFit: 'contain', padding: 20, borderRadius: 12 }}
              />
            ) : (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem' }}>🛍️</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="d-flex gap-2 mt-2">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: i === selectedImage ? '2px solid #e44d26' : '2px solid transparent' }}
                  onClick={() => setSelectedImage(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="col-md-7">
          <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{product.category} {product.brand && `• ${product.brand}`}</p>
          <h2 style={{ fontWeight: 700 }}>{product.name}</h2>

          <div className="d-flex align-items-center gap-2 my-2">
            <StarRating rating={product.ratings || 0} />
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>({product.numReviews} reviews)</span>
          </div>

          <div className="d-flex align-items-center gap-3 my-3">
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#e44d26' }}>
              ₹{(product.discountPrice || product.price).toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <>
                <span style={{ fontSize: '1.2rem', color: '#888', textDecoration: 'line-through' }}>
                  ₹{product.price.toLocaleString()}
                </span>
                <span className="badge" style={{ background: '#e44d26', fontSize: '0.9rem' }}>{discountPercent}% OFF</span>
              </>
            )}
          </div>

          <p style={{ color: '#555', lineHeight: 1.7 }}>{product.description}</p>

          <div className="d-flex align-items-center gap-3 my-3">
            <span style={{ fontWeight: 600 }}>Quantity:</span>
            <div className="qty-selector">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
            </div>
            <span className={`ms-2 badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
            </span>
          </div>

          <div className="d-flex gap-3 my-4">
            <button
              className="btn btn-lg"
              style={{ background: '#e44d26', color: 'white', borderRadius: 30, padding: '12px 32px', fontWeight: 600 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <FiShoppingCart className="me-2" />Add to Cart
            </button>
            <button
              className="btn btn-lg btn-outline-danger"
              style={{ borderRadius: 30, padding: '12px 32px', fontWeight: 600 }}
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Buy Now
            </button>
          </div>

          <div className="row g-2">
            {[
              { icon: FiTruck, text: 'Free delivery above ₹500' },
              { icon: FiShield, text: 'Secure & safe checkout' },
              { icon: FiPackage, text: '30-day easy returns' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="col-12">
                <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.875rem' }}>
                  <Icon size={16} color="#e44d26" />{text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="row mt-5">
        <div className="col-lg-8">
          <h4 className="fw-bold mb-4">Customer Reviews</h4>

          {/* Write Review */}
          {user && (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <h6 className="fw-bold">Write a Review</h6>
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <StarRating rating={reviewRating} interactive onRate={setReviewRating} />
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Share your experience..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn"
                    style={{ background: '#e44d26', color: 'white', borderRadius: 25 }}
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-muted">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="fw-semibold">{review.user?.name || review.name}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <small className="text-muted">{new Date(review.createdAt).toLocaleDateString()}</small>
                  </div>
                  <p className="mt-2 mb-0 text-muted">{review.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
