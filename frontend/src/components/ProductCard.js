import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PLACEHOLDER_ICON = '🛍️';

const StarRating = ({ rating }) => {
  return (
    <div className="stars d-flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={13}
          className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'}
          fill={s <= Math.round(rating) ? '#ffc107' : 'none'}
        />
      ))}
    </div>
  );
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock === 0) {
      toast.error('Out of stock');
      return;
    }
    addToCart({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      discountPrice: product.discountPrice || product.price,
      stock: product.stock,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="product-card card">
      <Link to={`/products/${product._id}`}>
        {discountPercent > 0 && (
          <span className="badge-discount">{discountPercent}% OFF</span>
        )}
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="product-img" />
        ) : (
          <div className="product-img-placeholder">{PLACEHOLDER_ICON}</div>
        )}
        <div className="card-body">
          <p className="product-name">{product.name}</p>
          <StarRating rating={product.ratings || 0} />
          <small className="text-muted">{product.numReviews || 0} reviews</small>
          <div className="d-flex align-items-center gap-2 mt-2">
            <span className="price-current">
              ₹{(product.discountPrice || product.price).toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <span className="price-original">₹{product.price.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="card-body pt-0">
        <button
          className="btn-add-cart btn"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <FiShoppingCart className="me-2" size={15} />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
