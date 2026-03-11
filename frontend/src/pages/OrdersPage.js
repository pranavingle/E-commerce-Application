import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../services/api';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import { FiPackage, FiChevronRight } from 'react-icons/fi';

const STATUS_CLASS = {
  Pending: 'status-pending',
  Confirmed: 'status-processing',
  Processing: 'status-processing',
  Shipped: 'status-shipped',
  Delivered: 'status-delivered',
  Cancelled: 'status-cancelled',
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm('Cancel this order?')) return;

    try {
      setCancellingId(orderId);
      const { data } = await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data : o)));
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">My Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: '5rem' }}>📦</div>
          <h4 className="mt-3">No orders yet</h4>
          <p className="text-muted">Start shopping to see your orders here!</p>
          <Link to="/products" className="btn mt-2" style={{ background: '#e44d26', color: 'white', borderRadius: 25, padding: '12px 32px', fontWeight: 600 }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div>
          {orders.map(order => {
            const status = order.orderStatus || order.status || 'Pending';
            const paymentCompleted = order.paymentStatus === 'Completed' || order.isPaid;
            const delivered = status === 'Delivered' || order.isDelivered;
            const canCancel = status !== 'Cancelled' && status !== 'Shipped' && status !== 'Delivered';

            return (
            <div
              key={order._id}
              className="order-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/orders/${order._id}`)}
            >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.9rem', color: '#888' }}>
                      Order #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`status-badge ${STATUS_CLASS[status] || 'status-pending'}`}>
                      {status}
                    </span>
                    <FiChevronRight color="#888" />
                  </div>
                </div>

                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {order.orderItems?.slice(0, 3).map(item => (
                    <div key={item._id} className="d-flex align-items-center gap-2">
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 48, height: 48, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛍️</div>
                      )}
                    </div>
                  ))}
                  {order.orderItems?.length > 3 && (
                    <div style={{ width: 48, height: 48, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                      +{order.orderItems.length - 3}
                    </div>
                  )}
                  <div className="ms-2">
                    <div className="fw-semibold">{order.orderItems?.length} item{order.orderItems?.length !== 1 ? 's' : ''}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {order.orderItems?.map(i => i.name).join(', ').substring(0, 40)}
                      {order.orderItems?.join(', ').length > 40 ? '...' : ''}
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span className={`badge ${paymentCompleted ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {paymentCompleted ? '✓ Paid' : 'Unpaid'}
                    </span>
                    <span className={`badge ${delivered ? 'bg-success' : 'bg-secondary'}`}>
                      {delivered ? '✓ Delivered' : 'Not Delivered'}
                    </span>
                    {canCancel && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => handleCancelOrder(e, order._id)}
                        disabled={cancellingId === order._id}
                      >
                        {cancellingId === order._id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                  <span className="fw-bold" style={{ color: '#e44d26' }}>
                    ₹{order.totalPrice?.toLocaleString()}
                  </span>
                </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
