import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSellerProducts, deleteProduct, createProduct } from '../services/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery', 'Other'];

const emptyForm = { name: '', description: '', price: '', discountPrice: '', category: '', brand: '', stock: '', images: [''], isFeatured: false };

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    getSellerProducts()
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProduct({
        ...form,
        price: Number(form.price),
        discountPrice: Number(form.discountPrice) || 0,
        stock: Number(form.stock),
        images: form.images.filter(img => img.trim()),
      });
      toast.success('Product created!');
      setShowForm(false);
      setForm(emptyForm);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRevenue = products.reduce((acc, p) => acc + (p.price * (p.numReviews || 0)), 0);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Seller Dashboard</h2>
        <button
          className="btn"
          style={{ background: '#e44d26', color: 'white', borderRadius: 25, fontWeight: 600 }}
          onClick={() => setShowForm(!showForm)}
        >
          <FiPlus className="me-1" /> {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Products', value: products.length, icon: '📦', color: '#e44d26' },
          { label: 'In Stock', value: products.filter(p => p.stock > 0).length, icon: '✅', color: '#28a745' },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, icon: '❌', color: '#dc3545' },
          { label: 'Featured', value: products.filter(p => p.isFeatured).length, icon: '⭐', color: '#f7941d' },
        ].map(stat => (
          <div key={stat.label} className="col-6 col-md-3">
            <div className="stat-card position-relative" style={{ borderLeftColor: stat.color }}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Form */}
      {showForm && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">Add New Product</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Product Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Category *</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required style={{ borderRadius: 8 }}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Description *</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">MRP (₹) *</label>
                  <input type="number" className="form-control" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required min="0" style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Selling Price (₹)</label>
                  <input type="number" className="form-control" value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} min="0" style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Stock *</label>
                  <input type="number" className="form-control" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required min="0" style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Brand</label>
                  <input className="form-control" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} style={{ borderRadius: 8 }} />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Image URL</label>
                  <input className="form-control" value={form.images[0]} onChange={e => setForm({ ...form, images: [e.target.value] })} placeholder="https://..." style={{ borderRadius: 8 }} />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="featured" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                    <label className="form-check-label fw-semibold" htmlFor="featured">Mark as Featured Product</label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-3 mt-4">
                <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 25 }} onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancel</button>
                <button type="submit" className="btn" style={{ background: '#e44d26', color: 'white', borderRadius: 25 }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? <Loader /> : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th className="ps-4 py-3">Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted"><FiPackage size={40} /><br />No products yet</td></tr>
                  ) : (
                    products.map(product => (
                      <tr key={product._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                            ) : (
                              <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛍️</div>
                            )}
                            <div>
                              <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{product.name}</div>
                              {product.isFeatured && <span className="badge" style={{ background: '#f7941d', fontSize: '0.7rem' }}>Featured</span>}
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-light text-dark">{product.category}</span></td>
                        <td>
                          <div className="fw-semibold" style={{ color: '#e44d26' }}>₹{(product.discountPrice || product.price).toLocaleString()}</div>
                          {product.discountPrice && product.discountPrice < product.price && (
                            <div style={{ fontSize: '0.78rem', color: '#888', textDecoration: 'line-through' }}>₹{product.price.toLocaleString()}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                            {product.stock > 0 ? product.stock : 'Out'}
                          </span>
                        </td>
                        <td>
                          <span className="text-warning">★</span> {product.ratings?.toFixed(1) || '0.0'}
                          <span className="text-muted ms-1" style={{ fontSize: '0.8rem' }}>({product.numReviews})</span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex gap-2 justify-content-end">
                            <Link to={`/products/${product._id}`} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }}>View</Link>
                            <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8 }} onClick={() => handleDelete(product._id, product.name)}>
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
