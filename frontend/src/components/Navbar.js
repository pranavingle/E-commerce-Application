import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiUser, FiSearch, FiLogOut, FiPackage, FiLayout } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemsCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="shopez-navbar navbar navbar-expand-lg">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Shop<span>EZ</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}
        >
          <span style={{ color: 'white', fontSize: '1.2rem' }}>☰</span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <form className="mx-auto d-flex search-bar" style={{ width: '40%' }} onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn" style={{ background: '#e44d26', color: 'white', borderRadius: 0 }}>
              <FiSearch />
            </button>
          </form>

          <ul className="navbar-nav ms-auto align-items-center gap-2">
            <li className="nav-item">
              <Link className="nav-link" to="/products">Shop</Link>
            </li>

            <li className="nav-item position-relative">
              <Link className="nav-link d-flex align-items-center gap-1" to="/cart">
                <FiShoppingCart size={20} />
                <span>Cart</span>
                {itemsCount > 0 && (
                  <span className="cart-badge text-white" style={{ background: '#e44d26', borderRadius: '50%', width: 20, height: 20, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {itemsCount}
                  </span>
                )}
              </Link>
            </li>

            {user ? (
              <li className="nav-item dropdown">
                <button
                  className="btn nav-link dropdown-toggle d-flex align-items-center gap-1"
                  data-bs-toggle="dropdown"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  <FiUser size={18} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: 12 }}>
                  <li><Link className="dropdown-item" to="/profile"><FiUser className="me-2" />Profile</Link></li>
                  <li><Link className="dropdown-item" to="/orders"><FiPackage className="me-2" />My Orders</Link></li>
                  {(user.role === 'seller' || user.role === 'admin') && (
                    <>
                      <li><Link className="dropdown-item" to="/seller/dashboard"><FiLayout className="me-2" />Seller Dashboard</Link></li>
                      <li><Link className="dropdown-item" to="/seller/orders"><FiPackage className="me-2" />Manage Orders</Link></li>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <li><Link className="dropdown-item" to="/admin/dashboard"><FiLayout className="me-2" />Admin Panel</Link></li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <FiLogOut className="me-2" />Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  <FiUser className="me-1" />Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
