import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiMapPin, FiCreditCard, FiCheckCircle } from 'react-icons/fi';

const STEPS = ['Shipping', 'Review', 'Payment'];

// Load Razorpay script dynamically and verify it is actually available
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(!!window.Razorpay));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);

    setTimeout(() => {
      if (!window.Razorpay) {
        resolve(false);
      }
    }, 10000);
  });
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, shippingAddress, discountPrice, shippingPrice, taxPrice, totalPrice, clearCart, saveShippingAddress } = useCart();
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [shipping, setShipping] = useState(shippingAddress || {
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zip: user?.address?.zip || '',
    country: user?.address?.country || 'India',
  });

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    saveShippingAddress(shipping);
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const orderItems = items.map(i => ({
        product: i.product,
        name: i.name,
        image: i.image,
        price: i.discountPrice || i.price,
        quantity: i.quantity,
      }));

      // Create order in DB
      const { data: orderData } = await api.post('/orders', {
        orderItems,
        shippingAddress: shipping,
        paymentMethod: 'Razorpay',
        itemsPrice: discountPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      });

      setOrderId(orderData._id);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const handlePayment = async () => {
    if (!orderId) {
      toast.error('Order not created yet. Please go back and try again.');
      return;
    }

    setPlacing(true);
    try {
      // Load Razorpay script first
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error('Unable to load Razorpay. Check internet and try again.');
        return;
      }

      // Create Razorpay order on backend
      const { data: paymentData } = await api.post('/payment/create-order', {
        orderId,
      });

      if (paymentData.devDirectPay) {
        await api.put(`/orders/${orderId}/pay`, {
          id: `DEV-${Date.now()}`,
          status: 'captured',
          update_time: new Date().toISOString(),
          payer: { email_address: user?.email || '' },
        });

        clearCart();
        toast.success('Payment successful! Order confirmed.');
        navigate(`/orders/${orderId}`);
        return;
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        order_id: paymentData.orderId,
        name: 'ShopEZ',
        description: 'Secure Payment Gateway',
        handler: async (response) => {
          try {
            // Verify payment
            const { data: verifyData } = await api.post('/payment/verify', {
              orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyData.success) {
              clearCart();
              toast.success('Payment successful! Order confirmed.');
              navigate(`/orders/${orderId}`);
            }
          } catch (err) {
            toast.error('Payment verification failed');
            console.error(err);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: {
          color: '#e44d26',
        },
        modal: {
          ondismiss: () => {
            toast.warning('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      console.error(err);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <h2 className="fw-bold mb-4">Checkout</h2>

      {/* Step Indicator */}
      <div className="d-flex justify-content-center mb-4">
        {STEPS.map((s, i) => (
          <div key={s} className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: 36, height: 36, background: step > i ? '#28a745' : step === i + 1 ? '#e44d26' : '#dee2e6', color: step >= i + 1 ? 'white' : '#888', fontWeight: 700 }}
            >
              {step > i ? '✓' : i + 1}
            </div>
            <span className="ms-2 me-3 fw-semibold" style={{ color: step === i + 1 ? '#e44d26' : '#888' }}>{s}</span>
            {i < STEPS.length - 1 && <div style={{ width: 40, height: 2, background: step > i + 1 ? '#28a745' : '#dee2e6' }} className="me-3" />}
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-4">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <form onSubmit={handleShippingSubmit}>
              <h5 className="fw-bold mb-4"><FiMapPin className="me-2 text-danger" />Shipping Address</h5>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Street Address *</label>
                  <input className="form-control" value={shipping.street} onChange={e => setShipping({ ...shipping, street: e.target.value })} required placeholder="123 Main Street" style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">City *</label>
                  <input className="form-control" value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} required placeholder="Mumbai" style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">State *</label>
                  <input className="form-control" value={shipping.state} onChange={e => setShipping({ ...shipping, state: e.target.value })} required placeholder="Maharashtra" style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">PIN Code *</label>
                  <input className="form-control" value={shipping.zip} onChange={e => setShipping({ ...shipping, zip: e.target.value })} required placeholder="400001" style={{ borderRadius: 8 }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Country *</label>
                  <input className="form-control" value={shipping.country} onChange={e => setShipping({ ...shipping, country: e.target.value })} required style={{ borderRadius: 8 }} />
                </div>
              </div>
              <button type="submit" className="btn mt-4 w-100" style={{ background: '#e44d26', color: 'white', borderRadius: 30, padding: 14, fontWeight: 700 }}>
                Review Order
              </button>
            </form>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div>
              <h5 className="fw-bold mb-4"><FiCheckCircle className="me-2 text-success" />Review Your Order</h5>
              <div className="mb-3">
                <h6 className="fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: 1 }}>Delivery To</h6>
                <p className="mb-0">{shipping.street}, {shipping.city}, {shipping.state} - {shipping.zip}, {shipping.country}</p>
              </div>
              <div className="mb-3">
                <h6 className="fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: 1 }}>Payment Method</h6>
                <p className="mb-0">💳 Razorpay (Card / UPI / Net Banking / Wallet)</p>
              </div>
              <div className="mb-4">
                <h6 className="fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: 1 }}>Items ({items.length})</h6>
                {items.map(item => (
                  <div key={item.product} className="d-flex justify-content-between py-2 border-bottom">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between py-2"><span className="text-muted">Subtotal</span><span>₹{discountPrice.toLocaleString()}</span></div>
                <div className="d-flex justify-content-between py-2"><span className="text-muted">Shipping</span><span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}</span></div>
                <div className="d-flex justify-content-between py-2"><span className="text-muted">Tax (GST)</span><span>₹{taxPrice}</span></div>
                <div className="d-flex justify-content-between py-2 fw-bold"><span>Total</span><span style={{ color: '#e44d26' }}>₹{totalPrice.toLocaleString()}</span></div>
              </div>
              <div className="d-flex gap-3">
                <button className="btn btn-outline-secondary w-50" style={{ borderRadius: 30 }} onClick={() => setStep(1)}>Back</button>
                <button
                  className="btn w-50"
                  style={{ background: '#e44d26', color: 'white', borderRadius: 30, fontWeight: 700 }}
                  onClick={handlePlaceOrder}
                  disabled={placing}
                >
                  {placing ? 'Creating Order...' : '💳 Proceed to Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="text-center">
              <h5 className="fw-bold mb-4"><FiCreditCard className="me-2 text-danger" />Secure Payment</h5>
              <p className="text-muted mb-4">Click the button below to proceed with secure payment via Razorpay</p>
              <div className="alert alert-info" role="alert">
                <strong>₹{totalPrice.toLocaleString()}</strong> will be charged to your account
              </div>
              <button
                className="btn w-100"
                style={{ background: '#e44d26', color: 'white', borderRadius: 30, padding: 16, fontWeight: 700, fontSize: '1.1rem' }}
                onClick={handlePayment}
                disabled={placing}
              >
                {placing ? 'Processing...' : '✅ Pay ₹' + totalPrice.toLocaleString()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
