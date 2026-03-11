import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getAllOrders, getAllUsers, updateUser, deleteUser } from '../services/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTrash2 } from 'react-icons/fi';

const STATUS_CLASS = { Pending: 'status-pending', Confirmed: 'status-processing', Processing: 'status-processing', Shipped: 'status-shipped', Delivered: 'status-delivered', Cancelled: 'status-cancelled' };
const DASHBOARD_REFRESH_MS = 15000;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    inactiveUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    returnsInitiated: 0,
    grossRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    confirmedRevenue: 0,
    cancelledRevenue: 0,
    netRevenue: 0,
    totalRefunds: 0,
    pendingRefunds: 0,
    revenueLoss: 0,
    cancellationRate: 0,
    returnRate: 0,
    refundSuccessRate: 100,
    paymentFailures: 0,
    activeDisputes: 0,
    recentOrders: [],
    topProducts: [],
  });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async (showInitialLoader = false) => {
      if (showInitialLoader) {
        setLoading(true);
      }

      const [statsRes, ordersRes, usersRes] = await Promise.allSettled([
        getDashboardStats(),
        getAllOrders(),
        getAllUsers(),
      ]);

      if (!isMounted) {
        return;
      }

      if (statsRes.status === 'fulfilled') {
        setStats((prev) => ({ ...prev, ...statsRes.value.data }));
      } else {
        toast.error(statsRes.reason?.response?.data?.message || 'Failed to load admin stats');
      }

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value.data || []);
      } else {
        toast.error(ordersRes.reason?.response?.data?.message || 'Failed to load orders');
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      } else {
        toast.error(usersRes.reason?.response?.data?.message || 'Failed to load users');
      }

      if (showInitialLoader) {
        setLoading(false);
      }
    };

    const handleWindowFocus = () => loadDashboard(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard(false);
      }
    };

    loadDashboard(true);

    const refreshInterval = setInterval(() => {
      loadDashboard(false);
    }, DASHBOARD_REFRESH_MS);

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleToggleUser = async (user) => {
    try {
      const { data } = await updateUser(user._id, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: data.isActive } : u));
      toast.success(`User ${data.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update user'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  if (loading) return <Loader />;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'orders', label: `Orders (${orders.length})` },
    { key: 'users', label: `Users (${users.length})` },
  ];

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Admin Dashboard</h2>

      {/* Stats */}
      {stats && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: <FiUsers size={24} />, color: '#0f3460' },
            { label: 'Total Sellers', value: stats.totalSellers, icon: <FiShoppingBag size={24} />, color: '#e44d26' },
            { label: 'Total Products', value: stats.totalProducts, icon: <FiPackage size={24} />, color: '#28a745' },
            { label: 'Total Orders', value: stats.totalOrders, icon: <FiPackage size={24} />, color: '#f7941d' },
            { label: 'Gross Revenue', value: `₹${stats.grossRevenue?.toLocaleString()}`, icon: <FiDollarSign size={24} />, color: '#6f42c1' },
          ].map(stat => (
            <div key={stat.label} className="col-6 col-md-4 col-lg">
              <div className="stat-card position-relative" style={{ borderLeftColor: stat.color }}>
                <div className="stat-icon" style={{ color: stat.color, opacity: 0.2 }}>{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue & Health Metrics */}
      {stats && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Paid Revenue', value: `₹${stats.paidRevenue?.toLocaleString()}`, icon: '💳', color: '#27ae60' },
            { label: 'Pending Revenue', value: `₹${stats.pendingRevenue?.toLocaleString()}`, icon: '⏳', color: '#f39c12' },
            { label: 'Confirmed Revenue', value: `₹${stats.confirmedRevenue?.toLocaleString()}`, icon: '✅', color: '#2980b9' },
            { label: 'Cancelled Revenue', value: `₹${stats.cancelledRevenue?.toLocaleString()}`, icon: '❌', color: '#c0392b' },
            { label: 'Net Revenue', value: `₹${stats.netRevenue?.toLocaleString()}`, icon: '💰', color: '#6f42c1' },
            { label: 'Revenue Loss', value: `₹${stats.revenueLoss?.toLocaleString()}`, icon: '📉', color: '#8e44ad' },
          ].map(metric => (
            <div key={metric.label} className="col-6 col-md-4 col-lg-2">
              <div className="stat-card position-relative" style={{ borderLeftColor: metric.color }}>
                <div className="stat-icon" style={{ fontSize: '1.5rem' }}>{metric.icon}</div>
                <div className="stat-value" style={{ fontSize: '0.9rem' }}>{metric.value}</div>
                <div className="stat-label" style={{ fontSize: '0.75rem' }}>{metric.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            className="btn"
            style={{ borderRadius: 25, background: activeTab === t.key ? '#e44d26' : 'white', color: activeTab === t.key ? 'white' : '#555', border: '1px solid #dee2e6', fontWeight: 600 }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="row g-4">
          <div className="col-12 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white">
                <h6 className="fw-bold mb-3">📊 Platform Operational Metrics</h6>
                <div className="row">
                  <div className="col-6 col-md-3">
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.pendingOrders || 0}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Pending Orders</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.deliveredOrders || 0}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Delivered Orders</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.cancelledOrders || 0}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Cancelled Orders</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.activeDisputes || 0}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Active Disputes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h6 className="fw-bold mb-3">Recent Orders</h6>
                {stats.recentOrders?.map(order => {
                  const status = order.orderStatus || order.status || 'Pending';
                  return (
                  <div key={order._id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>#{order._id.slice(-6).toUpperCase()}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{order.user?.name}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold" style={{ color: '#e44d26' }}>₹{order.totalPrice?.toLocaleString()}</div>
                      <span className={`status-badge ${STATUS_CLASS[status] || 'status-pending'}`} style={{ fontSize: '0.72rem' }}>{status}</span>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h6 className="fw-bold mb-3">Top Products</h6>
                {stats.topProducts?.map((product, i) => (
                  <div key={product._id} className="d-flex align-items-center gap-3 py-2 border-bottom">
                    <span className="fw-bold text-muted" style={{ minWidth: 20 }}>#{i + 1}</span>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛍️</div>
                    )}
                    <div className="flex-grow-1">
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{product.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{product.category}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold">₹{product.price?.toLocaleString()}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>★ {product.ratings?.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th className="ps-4 py-3">Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Paid</th>
                    <th className="pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const status = order.orderStatus || order.status || 'Pending';
                    const paid = order.paymentStatus === 'Completed' || order.isPaid;
                    return (
                    <tr key={order._id}>
                      <td className="ps-4 fw-semibold">#{order._id.slice(-6).toUpperCase()}</td>
                      <td>{order.user?.name}<div className="text-muted" style={{ fontSize: '0.78rem' }}>{order.user?.email}</div></td>
                      <td>{order.orderItems?.length}</td>
                      <td className="fw-semibold" style={{ color: '#e44d26' }}>₹{order.totalPrice?.toLocaleString()}</td>
                      <td><span className={`status-badge ${STATUS_CLASS[status] || 'status-pending'}`}>{status}</span></td>
                      <td>
                        <span className={`badge ${paid ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {paid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/orders/${order._id}`} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }}>View</Link>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th className="ps-4 py-3">User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th className="pe-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="ps-4">
                        <div className="fw-semibold">{u.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{u.email}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: u.role === 'admin' ? '#6f42c1' : u.role === 'seller' ? '#f7941d' : '#0f3460', textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm"
                            style={{ borderRadius: 8, background: u.isActive ? '#ffc107' : '#28a745', color: 'white' }}
                            onClick={() => handleToggleUser(u)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8 }} onClick={() => handleDeleteUser(u._id, u.name)}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
