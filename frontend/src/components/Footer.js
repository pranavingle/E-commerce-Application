import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="shopez-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="brand mb-3">Shop<span>EZ</span></div>
            <p style={{ fontSize: '0.9rem' }}>
              Your one-stop destination for effortless online shopping. Find the best products at the best prices.
            </p>
            <div className="d-flex gap-3 mt-3">
              {[FiFacebook, FiTwitter, FiInstagram, FiYoutube].map((Icon, i) => (
                <a key={i} href="#!" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem' }}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <h5>Shop</h5>
            {['All Products', 'Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports'].map(cat => (
              <Link key={cat} to={`/products?category=${cat}`}>{cat}</Link>
            ))}
          </div>
          <div className="col-lg-2 col-md-6">
            <h5>Account</h5>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/cart">Cart</Link>
          </div>
          <div className="col-lg-4 col-md-6">
            <h5>Contact</h5>
            <p style={{ fontSize: '0.9rem' }}>📧 support@shopez.com</p>
            <p style={{ fontSize: '0.9rem' }}>📞 1800-SHOPEZ-1</p>
            <p style={{ fontSize: '0.9rem' }}>🕐 Mon-Sat 9AM - 6PM</p>
            <div className="mt-3">
              <h6 style={{ color: 'white', fontSize: '0.875rem' }}>Newsletter</h6>
              <div className="d-flex">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Your email"
                  style={{ borderRadius: '8px 0 0 8px', fontSize: '0.875rem' }}
                />
                <button
                  className="btn"
                  style={{ background: '#e44d26', color: 'white', borderRadius: '0 8px 8px 0', whiteSpace: 'nowrap', fontSize: '0.875rem' }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0 20px' }} />
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} ShopEZ. All rights reserved.
          </p>
          <div className="d-flex gap-3" style={{ fontSize: '0.875rem' }}>
            <a href="#!" style={{ color: 'rgba(255,255,255,0.6)' }}>Privacy Policy</a>
            <a href="#!" style={{ color: 'rgba(255,255,255,0.6)' }}>Terms of Service</a>
            <a href="#!" style={{ color: 'rgba(255,255,255,0.6)' }}>Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
