import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrderStatus, cancelOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';

const STATUS_CLASS = { Pending: 'status-pending', Confirmed: 'status-processing', Processing: 'status-processing', Shipped: 'status-shipped', Delivered: 'status-delivered', Cancelled: 'status-cancelled' };
const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
    const status = order?.orderStatus || order?.status || 'Pending';
    const paymentCompleted = order?.paymentStatus === 'Completed' || order?.isPaid;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const { data } = await getOrderById(id);
        if (isMounted) setOrder(data);
      } catch (err) {
        if (isMounted) toast.error('Order not found');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    // Auto-refresh every 10 seconds to show automated status updates
    const interval = setInterval(fetchData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const handleStatusUpdate = async (status) => {
    setUpdating(true);
    try {
      const { data } = await updateOrderStatus(id, status);
      setOrder(data);
      toast.success(`Order status updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdating(true);
    try {
      const { data } = await cancelOrder(id);
      setOrder(data);
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Pending...';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressPercentage = () => {
    const stages = { Pending: 20, Confirmed: 40, Processing: 60, Shipped: 80, Delivered: 100 };
    return stages[status] || 0;
  };

  if (loading) return <Loader />;
  if (!order) return <div className="container py-5 text-center"><h4>Order not found</h4></div>;

  const currentStep = STATUS_STEPS.indexOf(status);
  const canCancel = status !== 'Cancelled' && status !== 'Shipped' && status !== 'Delivered';
  const isOwner = order?.user?._id === user?._id;

  return (
    <div className="container py-4">
      <button className="btn btn-link p-0 text-decoration-none mb-3" onClick={() => navigate(-1)}>
        <FiArrowLeft className="me-1" /> Back to Orders
      </button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Order Details</h2>
          <span className="text-muted">#{order._id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {(isOwner || user?.role === 'admin') && canCancel && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleCancelOrder}
              disabled={updating}
            >
              {updating ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
          <span className={`status-badge fs-6 ${STATUS_CLASS[status] || 'status-pending'}`}>{status}</span>
        </div>
      </div>

      {/* Progress Tracker with Auto-Update Info */}
      {status !== 'Cancelled' && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">🤖 Order Progress (Auto-Updated)</h6>
              <small className="text-success">Live Tracking</small>
            </div>
            <div className="progress" style={{ height: '40px', borderRadius: 10 }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${getProgressPercentage()}%`, borderRadius: 10, transition: 'width 0.3s ease' }}
                role="progressbar"
              >
                <strong>{getProgressPercentage()}%</strong>
              </div>
            </div>
            <div className="row mt-3 text-center">
              {[
                  { stage: 'Pending', icon: '📋', time: order.createdAt },
                  { stage: 'Confirmed', icon: '✅', time: order.paidAt },
                { stage: 'Processing', icon: '⚙️', time: order.processingStartedAt },
                { stage: 'Shipped', icon: '🚚', time: order.shippedAt },
                { stage: 'Delivered', icon: '✅', time: order.deliveredAt },
              ].map((item, idx) => {
                const isActive = STATUS_STEPS.indexOf(item.stage) <= currentStep;
                return (
                  <div key={idx} className="col">
                    <div style={{ fontSize: '1.5rem', opacity: isActive ? 1 : 0.3 }}>{item.icon}</div>
                    <small style={{ fontWeight: isActive ? 600 : 400, color: isActive ? '#e44d26' : '#888' }}>
                      {item.stage}
                    </small>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                      {formatDate(item.time)}
                    </div>
                  </div>
                );
              })}
            </div>
            {order.trackingNumber && (
              <div className="alert alert-info mt-3 mb-0">
                <strong>📦 Tracking:</strong> {order.trackingNumber}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          {/* Order Items */}
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3">Items Ordered</h6>
              {order.orderItems?.map(item => (
                <div key={item._id} className="d-flex align-items-center gap-3 py-2 border-bottom">
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🛍️</div>
                  )}
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{item.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>Qty: {item.quantity}</div>
                  </div>
                  <div className="fw-bold">₹{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h6 className="fw-bold mb-2">Shipping Address</h6>
              <p className="mb-0 text-muted">
                {order.shippingAddress?.street}, {order.shippingAddress?.city},<br />
                {order.shippingAddress?.state} - {order.shippingAddress?.zip},<br />
                {order.shippingAddress?.country}
              </p>
            </div>
          </div>

          {/* Admin Status Update */}
          {user?.role === 'admin' && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#fff3cd' }}>
              <div className="card-body">
                <h6 className="fw-bold mb-3">🔧 Manual Status Override (Admin Only)</h6>
                <div className="d-flex gap-2 flex-wrap">
                  {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                    <button
                      key={s}
                      className="btn btn-sm"
                      style={{ borderRadius: 20, background: status === s ? '#e44d26' : 'transparent', color: status === s ? 'white' : '#555', border: `1px solid ${status === s ? '#e44d26' : '#dee2e6'}` }}
                      onClick={() => handleStatusUpdate(s)}
                      disabled={updating || status === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <small className="text-muted mt-2 d-block">Use these controls only for manual admin correction.</small>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          {/* Order Summary */}
          <div className="cart-summary">
            <h6 className="fw-bold mb-3">Payment Summary</h6>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted">Items</span><span>₹{order.itemsPrice?.toLocaleString()}</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted">Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted">Tax (GST)</span><span>₹{order.taxPrice?.toLocaleString()}</span></div>
            <hr />
            <div className="d-flex justify-content-between mb-3"><span className="fw-bold">Total</span><span className="fw-bold" style={{ color: '#e44d26' }}>₹{order.totalPrice?.toLocaleString()}</span></div>
            <div className="mb-2">
              <span className="fw-semibold">Payment: </span>
              <span className="text-muted">{order.paymentMethod}</span>
            </div>
            <span className={`badge ${paymentCompleted ? 'bg-success' : 'bg-warning text-dark'}`}>
              {paymentCompleted ? `✓ Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Awaiting Payment'}
            </span>
            {order.receiptNumber && (
              <div className="mt-2 text-muted" style={{ fontSize: '0.85rem' }}>
                Receipt: <strong>{order.receiptNumber}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
