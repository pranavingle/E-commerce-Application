import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login, loading } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      toast.success('Welcome back!');
      navigate(redirect);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
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
          <h2 className="mt-2">Welcome Back!</h2>
          <p className="text-muted">Login to your account to continue shopping</p>
        </div>

        <form onSubmit={handleSubmit}>
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
                autoComplete="email"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text"><FiLock /></span>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button type="button" className="input-group-text" onClick={() => setShowPass(s => !s)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{ background: '#e44d26', color: 'white', borderRadius: 30, padding: 14, fontWeight: 700, fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {errorMessage && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              {errorMessage}
            </div>
          )}
        </form>

        <hr className="my-4" />
        <p className="text-center mb-2">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#e44d26', fontWeight: 600 }}>Register here</Link>
        </p>

        {/* Demo credentials */}
        <div className="alert alert-light border mt-3 p-3" style={{ borderRadius: 10, fontSize: '0.85rem' }}>
          <strong>Demo Credentials:</strong><br />
          User: user@shopez.com | Pass: password123<br />
          Admin: admin@shopez.com | Pass: admin123
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
