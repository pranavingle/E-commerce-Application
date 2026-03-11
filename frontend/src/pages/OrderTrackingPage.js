import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiPackage, FiCheckCircle, FiRefreshCw, FiMapPin, FiDollarSign } from 'react-icons/fi';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      if (!loading) toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, loading]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Order not found</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#ffc107';
      case 'Confirmed':
        return '#0d6efd';
      case 'Processing':
        return '#0dcaf0';
      case 'Shipped':
        return '#17a2b8';
      case 'Delivered':
        return '#28a745';
      case 'Cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentStatusIndex = statuses.indexOf(order.orderStatus);

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <FiPackage className="me-2" />
          Track Your Order
        </h2>
        <button className="btn btn-sm btn-outline-secondary" onClick={fetchOrder} style={{ borderRadius: 20 }}>
          <FiRefreshCw style={{ fontSize: '0.9rem' }} /> Refresh
        </button>
      </div>

      {/* Order Header */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, background: '#f8f9fa' }}>
        <div className="card-body p-4">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>Order Number</h6>
              <h5 className="fw-bold">#{order._id.slice(-8).toUpperCase()}</h5>
            </div>
            <div className="col-md-6 text-md-end">
              <h6 className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>Order Total</h6>
              <h5 className="fw-bold" style={{ color: '#e44d26' }}>
                <FiDollarSign style={{ fontSize: '1rem' }} />
                ₹{order.totalPrice.toLocaleString()}
              </h5>
            </div>
          </div>
          {order.orderStatus === 'Delivered' && (
            <div className="alert alert-success mt-3 mb-0">
              <strong>✓ Delivered!</strong> Your order was delivered on {new Date(order.deliveredAt).toLocaleDateString()}
            </div>
          )}
          {order.orderStatus === 'Cancelled' && (
            <div className="alert alert-danger mt-3 mb-0">
              <strong>✗ Cancelled</strong>
            </div>
          )}
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body p-4">
          <h6 className="fw-bold mb-4">Order Status</h6>
          <div className="d-flex justify-content-between position-relative mb-4" style={{ paddingBottom: 20 }}>
            {statuses.map((status, idx) => (
              <div key={status} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 50,
                    height: 50,
                    background: idx <= currentStatusIndex ? getStatusColor(status) : '#dee2e6',
                    color: 'white',
                    fontSize: '1.2rem',
                    marginBottom: 8,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {idx < currentStatusIndex ? (
                    <FiCheckCircle />
                  ) : idx === currentStatusIndex ? (
                    <FiPackage />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <small className="text-center text-muted">{status}</small>
              </div>
            ))}
            {/* Progress Line */}
            <div
              style={{
                position: 'absolute',
                top: 25,
                left: 0,
                height: 2,
                background: getStatusColor(order.orderStatus),
                width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%`,
                zIndex: 1,
                transition: 'width 0.3s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 25,
                left: `${(currentStatusIndex / (statuses.length - 1)) * 100}%`,
                right: 0,
                height: 2,
                background: '#dee2e6',
                zIndex: 1,
              }}
            />
          </div>

          {/* Status Details */}
          <div className="alert alert-info" role="alert">
            <strong>Current Status:</strong> {order.orderStatus}
            {order.orderStatus === 'Shipped' && order.trackingNumber && (
              <>
                <br />
                <strong>Tracking Number:</strong> {order.trackingNumber}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-header p-3" style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
          <h6 className="fw-bold mb-0">
            <FiMapPin className="me-2" style={{ fontSize: '1rem' }} />
            Delivery Address
          </h6>
        </div>
        <div className="card-body p-4">
          <p className="mb-0">
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}<br />
            {order.shippingAddress.country}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-header p-3" style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
          <h6 className="fw-bold mb-0">Order Items ({order.orderItems.length})</h6>
        </div>
        <div className="card-body p-4">
          {order.orderItems.map((item, idx) => (
            <div
              key={idx}
              className="d-flex justify-content-between align-items-center py-3"
              style={{ borderBottom: idx < order.orderItems.length - 1 ? '1px solid #dee2e6' : 'none' }}
            >
              <div className="d-flex align-items-center">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginRight: 15,
                  }}
                />
                <div>
                  <h6 className="mb-1 fw-semibold">{item.product.name}</h6>
                  <small className="text-muted">Qty: {item.quantity}</small>
                </div>
              </div>
              <div className="text-end">
                <p className="mb-0 fw-semibold">₹{item.price.toLocaleString()}</p>
                <small className="text-muted">₹{(item.price * item.quantity).toLocaleString()} total</small>
              </div>
            </div>
          ))}

          {/* Price Breakdown */}
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span>₹{(order.totalPrice - order.shippingPrice - order.taxPrice).toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Shipping</span>
              <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Tax (GST)</span>
              <span>₹{order.taxPrice}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold mt-3 pt-3 border-top" style={{ fontSize: '1.1rem' }}>
              <span>Total</span>
              <span style={{ color: '#e44d26' }}>₹{order.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
