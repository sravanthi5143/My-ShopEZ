import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaShoppingBag, FaArrowRight } from 'react-icons/fa';
import Price from '../components/Price';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();

  // Retrieve state parameters passed from Checkout
  const orderDetails = useMemo(() => {
    const state = location.state || {};
    return {
      orderId: state.orderId || `ORD-EZ-${Math.floor(100000 + Math.random() * 900000)}`,
      transactionId: state.transactionId || (state.paymentMethod === 'Cash on Delivery' ? null : `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`),
      paymentMethod: state.paymentMethod || 'UPI',
      total: state.total || 0
    };
  }, [location.state]);

  // Calculate mock delivery date (5 days from today)
  const deliveryDate = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 5);
    return today.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="order-success-page">
      <div className="success-card">
        <div className="success-icon-circle">
          <FaCheckCircle className="success-icon" />
        </div>
        
        <h1 className="success-title">Payment Successful</h1>
        <p className="success-subtitle">
          Thank you for shopping with us. Your order has been placed successfully and is now being prepared.
        </p>

        <div className="order-details-box">
          <div className="details-row">
            <span>Order ID:</span>
            <strong>{orderDetails.orderId}</strong>
          </div>
          {orderDetails.transactionId && (
            <div className="details-row">
              <span>Transaction ID:</span>
              <strong>{orderDetails.transactionId}</strong>
            </div>
          )}
          <div className="details-row">
            <span>Payment Method:</span>
            <strong>{orderDetails.paymentMethod}</strong>
          </div>
          {orderDetails.total > 0 && (
            <div className="details-row">
              <span>Amount Paid:</span>
              <strong>
                <Price price={orderDetails.total} size="sm" />
              </strong>
            </div>
          )}
          <div className="details-row">
            <span>Estimated Delivery:</span>
            <strong>{deliveryDate}</strong>
          </div>
          <p className="delivery-note">
            A confirmation containing your tracking link and invoice receipt has been generated.
          </p>
        </div>

        <div className="success-actions-row">
          <Link to="/my-orders" className="btn btn-primary">
            <FaShoppingBag /> View My Orders
          </Link>
          <Link to="/products" className="btn btn-secondary">
            Continue Shopping <FaArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
