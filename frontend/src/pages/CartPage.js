import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiTrash2, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, itemsCount, discountPrice, shippingPrice, taxPrice, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div style={{ fontSize: '6rem' }}>🛒</div>
        <h3 className="mt-3 fw-bold">Your cart is empty</h3>
        <p className="text-muted">Looks like you haven't added anything yet.</p>
        <Link
          to="/products"
          className="btn mt-3"
          style={{ background: '#e44d26', color: 'white', borderRadius: 25, padding: '12px 32px', fontWeight: 600 }}
        >
          <FiShoppingBag className="me-2" />Start Shopping
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-link p-0 text-decoration-none" onClick={() => navigate(-1)}>
          <FiArrowLeft className="me-1" />
        </button>
        <h2 className="fw-bold mb-0">Shopping Cart</h2>
        <span className="badge rounded-pill" style={{ background: '#e44d26' }}>{itemsCount}</span>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          {items.map((item) => (
            <div key={item.product} className="cart-item">
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ width: 80, height: 80, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  🛍️
                </div>
              )}
              <div className="flex-grow-1">
                <Link to={`/products/${item.product}`} className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                  {item.name}
                </Link>
                <div className="d-flex align-items-center gap-3 mt-2">
                  <span style={{ color: '#e44d26', fontWeight: 700 }}>
                    ₹{(item.discountPrice || item.price).toLocaleString()}
                  </span>
                  {item.discountPrice && item.discountPrice < item.price && (
                    <span style={{ fontSize: '0.8rem', color: '#888', textDecoration: 'line-through' }}>
                      ₹{item.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="qty-selector">
                <button onClick={() => item.quantity > 1 ? updateQuantity(item.product, item.quantity - 1) : removeFromCart(item.product)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => item.quantity < item.stock && updateQuantity(item.product, item.quantity + 1)}>+</button>
              </div>
              <div className="text-end">
                <div className="fw-bold">₹{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</div>
                <button className="btn btn-link text-danger p-0 mt-1" onClick={() => removeFromCart(item.product)}>
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          <button className="btn btn-link text-danger text-decoration-none mt-2" onClick={clearCart}>
            <FiTrash2 className="me-1" /> Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="col-lg-4">
          <div className="cart-summary">
            <h5 className="fw-bold mb-4">Order Summary</h5>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Items ({itemsCount})</span>
              <span>₹{discountPrice.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Shipping</span>
              <span>{shippingPrice === 0 ? <span className="text-success">FREE</span> : `₹${shippingPrice}`}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Tax (18% GST)</span>
              <span>₹{taxPrice.toLocaleString()}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-4">
              <span className="fw-bold fs-5">Total</span>
              <span className="fw-bold fs-5" style={{ color: '#e44d26' }}>₹{totalPrice.toLocaleString()}</span>
            </div>
            {shippingPrice > 0 && (
              <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.85rem', borderRadius: 8 }}>
                Add ₹{(500 - discountPrice).toFixed(0)} more for FREE shipping!
              </div>
            )}
            <button
              className="btn w-100"
              style={{ background: '#e44d26', color: 'white', borderRadius: 30, padding: '14px', fontWeight: 700, fontSize: '1rem' }}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
            <Link
              to="/products"
              className="btn w-100 mt-2"
              style={{ borderRadius: 30, border: '2px solid #e44d26', color: '#e44d26', fontWeight: 600 }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
