import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { FiArrowRight, FiShield, FiTruck, FiRefreshCw, FiHeadphones } from 'react-icons/fi';

const CATEGORIES = [
  { name: 'Electronics', icon: '💻' },
  { name: 'Fashion', icon: '👗' },
  { name: 'Home & Kitchen', icon: '🏠' },
  { name: 'Books', icon: '📚' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Toys', icon: '🧸' },
  { name: 'Grocery', icon: '🛒' },
];

const FEATURES = [
  { icon: <FiTruck size={28} />, title: 'Free Shipping', desc: 'On orders above ₹500' },
  { icon: <FiShield size={28} />, title: 'Secure Payment', desc: '100% secure transactions' },
  { icon: <FiRefreshCw size={28} />, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: <FiHeadphones size={28} />, title: '24/7 Support', desc: 'Dedicated customer support' },
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getFeaturedProducts()
      .then(({ data }) => setFeaturedProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1>
                Shop Smart,<br />
                Shop <span>Easy</span>
              </h1>
              <p className="my-4">
                Discover thousands of products at unbeatable prices. From electronics to fashion — everything in one place.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <button className="btn-shopez btn" onClick={() => navigate('/products')}>
                  Shop Now <FiArrowRight className="ms-2" />
                </button>
                <Link to="/register" className="btn-shopez-outline btn">
                  Sell with Us
                </Link>
              </div>
              <div className="d-flex gap-4 mt-4 flex-wrap">
                {[['50K+', 'Products'], ['10K+', 'Sellers'], ['500K+', 'Customers']].map(([val, label]) => (
                  <div key={label}>
                    <div style={{ color: '#f7941d', fontWeight: 700, fontSize: '1.5rem' }}>{val}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6 text-center d-none d-lg-block">
              <div style={{ fontSize: '12rem', opacity: 0.15 }}>🛍️</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'white', padding: '40px 0', borderBottom: '1px solid #eee' }}>
        <div className="container">
          <div className="row g-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="col-6 col-md-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ color: '#e44d26' }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{f.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '60px 0', background: '#f5f5f5' }}>
        <div className="container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <div className="divider"></div>
            <p className="text-muted">Find what you're looking for</p>
          </div>
          <div className="row g-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="col-6 col-md-4 col-lg-3">
                <div
                  className="category-card"
                  onClick={() => navigate(`/products?category=${cat.name}`)}
                >
                  <div className="icon">{cat.icon}</div>
                  <h6>{cat.name}</h6>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <div className="divider"></div>
            <p className="text-muted">Hand-picked products just for you</p>
          </div>
          {loading ? (
            <Loader />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem' }}>🛍️</div>
              <p className="text-muted mt-3">No featured products yet. Check back soon!</p>
              <Link to="/products" className="btn btn-shopez mt-2" style={{ background: '#e44d26', color: 'white', borderRadius: 25, padding: '10px 28px' }}>
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              {featuredProducts.map((product) => (
                <div key={product._id} className="col-6 col-md-4 col-lg-3">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
          {featuredProducts.length > 0 && (
            <div className="text-center mt-4">
              <Link
                to="/products"
                className="btn"
                style={{ background: '#e44d26', color: 'white', borderRadius: 25, padding: '12px 36px', fontWeight: 600 }}
              >
                View All Products <FiArrowRight className="ms-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Banner */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', padding: '60px 0', color: 'white' }}>
        <div className="container text-center">
          <h2 style={{ fontWeight: 700, fontSize: '2rem' }}>Become a Seller on ShopEZ</h2>
          <p style={{ opacity: 0.8, maxWidth: 500, margin: '16px auto' }}>
            Reach millions of customers. Manage your store with our powerful seller dashboard.
          </p>
          <Link
            to="/register"
            className="btn mt-2"
            style={{ background: '#e44d26', color: 'white', borderRadius: 25, padding: '12px 36px', fontWeight: 700 }}
          >
            Start Selling Today
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
