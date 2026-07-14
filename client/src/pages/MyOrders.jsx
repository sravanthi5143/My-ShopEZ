import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaShoppingBag, 
  FaInfoCircle, 
  FaTruck, 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle,
  FaCalendarAlt,
  FaMoneyBillWave
} from 'react-icons/fa';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';
import { formatPrice } from '../utils/priceFormatter';
import Price from '../components/Price';
import './MyOrders.css';

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Local States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [detailsOrder, setDetailsOrder] = useState(null);

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      try {
        const response = await axios.get('/api/orders/myorders', config);
        setOrders(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load orders', error);
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Handle persistent database cancellation
  const handleCancelOrder = async (id) => {
    if (window.confirm(`Are you sure you want to cancel order ${id}?`)) {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      try {
        const response = await axios.put(`/api/orders/${id}/cancel`, {}, config);
        setOrders((prevOrders) =>
          prevOrders.map((ord) => ord._id === id ? response.data : ord)
        );
        toast.success('Order cancelled successfully.');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel order.');
      }
    }
  };

  const getStatusClass = (status = '') => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'delivered':
        return 'badge-success';
      case 'shipped':
      case 'out for delivery':
        return 'badge-blue';
      case 'pending':
      case 'confirmed':
      case 'processing':
      case 'packed':
        return 'badge-warning';
      case 'cancelled':
      default:
        return 'badge-danger';
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="my-orders-page-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Manage, track, and view detailed invoices of your purchases</p>
      </div>

      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((ord) => {
            const orderDateStr = new Date(ord.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={ord._id} className="order-item-card">
                {/* Card Top Info Header */}
                <div className="order-card-header">
                  <div className="header-meta-group">
                    <div className="meta-item">
                      <span className="meta-lbl">Order ID</span>
                      <strong className="meta-val">{ord._id}</strong>
                    </div>
                    <div className="meta-item">
                      <span className="meta-lbl"><FaCalendarAlt /> Date</span>
                      <strong className="meta-val">{orderDateStr}</strong>
                    </div>
                    <div className="meta-item">
                      <span className="meta-lbl"><FaMoneyBillWave /> Total</span>
                      <strong className="meta-val price"><Price price={ord.totalPrice} size="sm" /></strong>
                    </div>
                  </div>

                  <div className="header-badges-group">
                    <span className={`status-pill ${getStatusClass(ord.isPaid ? 'paid' : 'pending')}`}>
                      Payment: {ord.isPaid ? 'Paid' : 'Pending'}
                    </span>
                    <span className={`status-pill ${getStatusClass(ord.orderStatus || 'Pending')}`}>
                      Status: {ord.orderStatus || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Card Center: List summary of items */}
                <div className="order-card-body">
                  <p className="order-items-summary-text">
                    Contains <strong>{ord.orderItems?.reduce((acc, curr) => acc + curr.quantity, 0) || 0}</strong>{' '}
                    {ord.orderItems?.reduce((acc, curr) => acc + curr.quantity, 0) === 1 ? 'item' : 'items'}:{' '}
                    {ord.orderItems?.map((i) => `${i.product?.name || 'Product'} (x${i.quantity})`).join(', ')}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="order-card-footer">
                  <div className="action-btns-group">
                    <button 
                      className="btn btn-secondary order-action-btn"
                      onClick={() => setDetailsOrder(ord)}
                    >
                      <FaInfoCircle /> View Details
                    </button>
                    {(ord.orderStatus || 'Pending').toLowerCase() !== 'cancelled' && (
                      <button 
                        className="btn btn-secondary order-action-btn"
                        onClick={() => setTrackingOrder(ord)}
                      >
                        <FaTruck /> Track Order
                      </button>
                    )}
                  </div>

                  {(ord.orderStatus || 'Pending').toLowerCase() === 'pending' && (
                    <button 
                      className="btn btn-danger-outline cancel-order-btn"
                      onClick={() => handleCancelOrder(ord._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-orders-found">
          <FaShoppingBag className="no-orders-icon" />
          <h3>No Orders Placed Yet</h3>
          <p>You haven't purchased any items yet. Explore our products and place your first order!</p>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      )}

      {/* 1. VIEW DETAILS MODAL */}
      {detailsOrder && (
        <div className="modal-overlay" onClick={() => setDetailsOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details: {detailsOrder._id}</h3>
              <button className="close-modal-btn" onClick={() => setDetailsOrder(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body scrollable">
              {/* Address details */}
              <div className="modal-detail-block">
                <h4>Shipping Information</h4>
                <p>
                  {typeof detailsOrder.shippingAddress === 'object' ? (
                    <>
                      <strong>{detailsOrder.shippingAddress.fullName}</strong><br />
                      {detailsOrder.shippingAddress.address}, {detailsOrder.shippingAddress.city}, {detailsOrder.shippingAddress.state} {detailsOrder.shippingAddress.postalCode}, {detailsOrder.shippingAddress.country}<br />
                      Phone: {detailsOrder.shippingAddress.phone}
                    </>
                  ) : (
                    detailsOrder.shippingAddress
                  )}
                </p>
              </div>

              {/* Payment Details */}
              <div className="modal-detail-block">
                <h4>Payment Method</h4>
                <p>{detailsOrder.paymentMethod} ({detailsOrder.isPaid ? 'Paid' : 'Pending'})</p>
              </div>

              {/* Items Breakdown */}
              <div className="modal-detail-block">
                <h4>Items Ordered</h4>
                <div className="modal-items-table">
                  {detailsOrder.orderItems?.map((item, idx) => (
                    <div key={idx} className="modal-item-row">
                      <span>{item.product?.name || 'Product'} <strong>(x{item.quantity})</strong></span>
                      <span><Price price={item.price * item.quantity} size="sm" /></span>
                    </div>
                  ))}
                </div>
              </div>

              <hr />

              {/* Total Summary */}
              <div className="modal-total-summary">
                <span>Grand Total:</span>
                <strong><Price price={detailsOrder.totalPrice} size="md" /></strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDER TRACKING MODAL */}
      {trackingOrder && (
        <div className="modal-overlay" onClick={() => setTrackingOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Track Order: {trackingOrder._id}</h3>
              <button className="close-modal-btn" onClick={() => setTrackingOrder(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {trackingOrder.orderStatus === 'Cancelled' && (
                <div className="auth-alert error" style={{ marginBottom: '15px' }}>
                  This order has been Cancelled.
                </div>
              )}
              <div className="tracking-timeline">
                {[
                  { 
                    title: 'Order Placed', 
                    desc: 'Order transaction accepted and processed', 
                    check: trackingOrder.orderStatus !== 'Cancelled' 
                  },
                  { 
                    title: 'Confirmed', 
                    desc: 'Order confirmed and verified', 
                    check: ['confirmed', 'processing', 'packed', 'shipped', 'out for delivery', 'delivered'].includes((trackingOrder.orderStatus || '').toLowerCase())
                  },
                  { 
                    title: 'Processing', 
                    desc: 'Package packed and checked at hub', 
                    check: ['processing', 'packed', 'shipped', 'out for delivery', 'delivered'].includes((trackingOrder.orderStatus || '').toLowerCase())
                  },
                  { 
                    title: 'Packed', 
                    desc: 'Package is packed and ready to ship', 
                    check: ['packed', 'shipped', 'out for delivery', 'delivered'].includes((trackingOrder.orderStatus || '').toLowerCase())
                  },
                  { 
                    title: 'Shipped', 
                    desc: 'Package departed carrier facility', 
                    check: ['shipped', 'out for delivery', 'delivered'].includes((trackingOrder.orderStatus || '').toLowerCase()) 
                  },
                  { 
                    title: 'Out For Delivery', 
                    desc: 'Package out with delivery agent', 
                    check: ['out for delivery', 'delivered'].includes((trackingOrder.orderStatus || '').toLowerCase()) 
                  },
                  { 
                    title: 'Delivered', 
                    desc: 'Package arrived at delivery location', 
                    check: (trackingOrder.orderStatus || '').toLowerCase() === 'delivered' 
                  }
                ].map((step, idx) => (
                  <div key={idx} className={`timeline-step ${step.check ? 'completed' : ''}`}>
                    <div className="timeline-node">
                      {step.check ? <FaCheckCircle /> : <div className="timeline-dot"></div>}
                    </div>
                    <div className="timeline-content">
                      <h5>{step.title}</h5>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
