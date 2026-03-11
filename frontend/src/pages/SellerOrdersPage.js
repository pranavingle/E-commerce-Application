import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiPackage, FiTruck, FiMapPin, FiCalendar, FiDollarSign } from 'react-icons/fi';

const SellerOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/seller/orders');
      setOrders(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkProcessing = async (orderId) => {
    try {
      setUpdatingId(orderId);
      const { data } = await api.put(`/seller/orders/${orderId}/status`, {
        orderStatus: 'Processing',
      });
      setOrders(orders.map(o => o._id === orderId ? data : o));
      toast.success('Order marked as Processing');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkShipped = async (orderId) => {
    if (!trackingNumber) {
      toast.warning('Please enter a tracking number');
      return;
    }

    try {
      setUpdatingId(orderId);
      const { data } = await api.put(`/seller/orders/${orderId}/status`, {
        orderStatus: 'Shipped',
        trackingNumber,
      });
      setOrders(orders.map(o => o._id === orderId ? data : o));
      toast.success('Order marked as Shipped with tracking number');
      setTrackingNumber('');
      setExpandedOrderId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          You must be logged in as a seller to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">
        <FiPackage className="me-2" />
        Seller Orders Dashboard
      </h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="alert alert-info">
          No confirmed orders yet. When customers complete payment, their orders will appear here.
        </div>
      ) : (
        <div className="row g-3">
          {orders.map(order => (
            <div key={order._id} className="col-12">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <div
                  className="card-header p-3 d-flex justify-content-between align-items-center"
                  style={{
                    background: '#f8f9fa',
                    borderTop: `4px solid ${
                      order.orderStatus === 'Delivered' ? '#28a745' :
                      order.orderStatus === 'Shipped' ? '#0dcaf0' :
                      order.orderStatus === 'Processing' ? '#0d6efd' :
                      '#ffc107'
                    }`,
                    borderRadius: '12px 12px 0 0',
                  }}
                >
                  <div>
                    <h6 className="mb-1 fw-bold">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h6>
                    <small className="text-muted">
                      <FiCalendar className="me-1" style={{ fontSize: '0.8rem' }} />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="text-end">
                    <div className="badge" style={{
                      background:
                        order.orderStatus === 'Delivered' ? '#d1e7dd' :
                        order.orderStatus === 'Shipped' ? '#cfe2ff' :
                        order.orderStatus === 'Processing' ? '#cff4fc' :
                        '#fff3cd',
                      color:
                        order.orderStatus === 'Delivered' ? '#166534' :
                        order.orderStatus === 'Shipped' ? '#084298' :
                        order.orderStatus === 'Processing' ? '#055160' :
                        '#664d03',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                    }}>
                      {order.orderStatus}
                    </div>
                  </div>
                </div>

                <div className="card-body p-3">
                  {/* Customer Info */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <h6 className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>Customer</h6>
                      <p className="mb-1 fw-semibold">{order.user.name}</p>
                      <small className="text-muted">{order.user.email}</small><br />
                      {order.user.phone && <small className="text-muted">{order.user.phone}</small>}
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>Delivery Address</h6>
                      <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                        <FiMapPin className="me-1" style={{ fontSize: '0.8rem' }} />
                        {order.shippingAddress.street}, {order.shippingAddress.city},<br />
                        {order.shippingAddress.state} - {order.shippingAddress.zip}, {order.shippingAddress.country}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <h6 className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>Items Ordered</h6>
                  <div className="mb-3">
                    {order.orderItems.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between py-2 border-bottom">
                        <span>
                          <img src={item.product.image} alt={item.product.name} style={{ width: 40, height: 40, borderRadius: 4, marginRight: 8 }} />
                          {item.product.name}
                        </span>
                        <span>
                          ₹{item.price} × {item.quantity} = <strong>₹{(item.price * item.quantity).toLocaleString()}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <small className="text-muted">Subtotal</small><br />
                      <small className="text-muted">Shipping</small><br />
                      <small className="text-muted">Tax</small><br />
                      <h6 className="fw-bold mt-2">Total Amount</h6>
                    </div>
                    <div className="col-6 text-end">
                      <small>₹{(order.totalPrice - order.shippingPrice - order.taxPrice).toLocaleString()}</small><br />
                      <small>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</small><br />
                      <small>₹{order.taxPrice}</small><br />
                      <h6 className="fw-bold mt-2" style={{ color: '#e44d26' }}>
                        <FiDollarSign style={{ fontSize: '0.9rem' }} />
                        ₹{order.totalPrice.toLocaleString()}
                      </h6>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="alert alert-info mb-3">
                      <strong>Tracking:</strong> {order.trackingNumber}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-footer p-3" style={{ background: '#f8f9fa' }}>
                  {order.orderStatus === 'Confirmed' ? (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm flex-grow-1"
                        style={{ background: '#0d6efd', color: 'white', borderRadius: 6 }}
                        onClick={() => handleMarkProcessing(order._id)}
                        disabled={updatingId === order._id}
                      >
                        <FiPackage className="me-1" style={{ fontSize: '0.8rem' }} />
                        {updatingId === order._id ? 'Updating...' : 'Mark as Processing'}
                      </button>
                    </div>
                  ) : order.orderStatus === 'Processing' ? (
                    <div className="d-flex gap-2 flex-column">
                      {expandedOrderId === order._id ? (
                        <>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Enter tracking number (e.g., FDX123456789)"
                            value={trackingNumber}
                            onChange={e => setTrackingNumber(e.target.value)}
                            style={{ borderRadius: 6 }}
                          />
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm flex-grow-1"
                              style={{ background: '#28a745', color: 'white', borderRadius: 6 }}
                              onClick={() => handleMarkShipped(order._id)}
                              disabled={updatingId === order._id}
                            >
                              {updatingId === order._id ? 'Shipping...' : 'Ship Order'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary flex-grow-1"
                              onClick={() => {
                                setExpandedOrderId(null);
                                setTrackingNumber('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm flex-grow-1"
                          style={{ background: '#28a745', color: 'white', borderRadius: 6 }}
                          onClick={() => setExpandedOrderId(order._id)}
                        >
                          <FiTruck className="me-1" style={{ fontSize: '0.8rem' }} />
                          Ship Order
                        </button>
                      )}
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-secondary w-100" disabled style={{ borderRadius: 6 }}>
                      {order.orderStatus === 'Delivered' ? '✓ Delivered' : 'No action needed'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
