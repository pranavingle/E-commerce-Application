import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return toast.error('Passwords do not match!');
    }
    if (form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return toast.error('Password must be at least 6 characters');
    }
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.role);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-4">
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1a1a2e' }}>
            Shop<span style={{ color: '#e44d26' }}>EZ</span>
          </h1>
          <h2 className="mt-2">Create Account</h2>
          <p className="text-muted">Join millions of happy shoppers!</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Full Name</label>
            <div className="input-group">
              <span className="input-group-text"><FiUser /></span>
              <input
                type="text"
                className="form-control"
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <div className="input-group">
              <span className="input-group-text"><FiMail /></span>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text"><FiLock /></span>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="input-group-text" onClick={() => setShowPass(s => !s)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text"><FiLock /></span>
              <input
                type="password"
                className="form-control"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Account Type</label>
            <div className="d-flex gap-3">
              {[
                { value: 'user', label: '🛍️ Buyer', desc: 'Shop from thousands of products' },
                { value: 'seller', label: '🏪 Seller', desc: 'Sell your products on ShopEZ' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className="flex-fill p-3 border text-center"
                  style={{ cursor: 'pointer', borderRadius: 10, borderColor: form.role === opt.value ? '#e44d26' : '#dee2e6', background: form.role === opt.value ? '#fff5f3' : 'white' }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={form.role === opt.value}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="d-none"
                  />
                  <div className="fw-semibold">{opt.label}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{ background: '#e44d26', color: 'white', borderRadius: 30, padding: 14, fontWeight: 700, fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          {errorMessage && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              {errorMessage}
            </div>
          )}
        </form>

        <hr className="my-4" />
        <p className="text-center">
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#e44d26', fontWeight: 600 }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
