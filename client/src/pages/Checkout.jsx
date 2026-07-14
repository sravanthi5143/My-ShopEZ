import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaList, 
  FaEye, 
  FaArrowLeft, 
  FaArrowRight, 
  FaCheckCircle, 
  FaShieldAlt,
  FaCopy,
  FaCheck,
  FaQrcode,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaMoneyBillWave,
  FaTimes
} from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';
import Price from '../components/Price';
import { formatPrice } from '../utils/priceFormatter';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Coupon promo states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Context states
  const { user } = useContext(AuthContext);
  const { cartItems, clearCart } = useContext(CartContext);

  // Extract buyNowItem if navigated via Buy Now CTA
  const buyNowItem = location.state?.buyNowItem || null;

  // Use either the single buyNowItem or standard cart items list
  const checkoutItems = useMemo(() => {
    return buyNowItem ? [buyNowItem] : cartItems;
  }, [buyNowItem, cartItems]);

  // Form states saved upon moving to next step
  const [shippingAddress, setShippingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  // Specific Payment details
  const [selectedBank, setSelectedBank] = useState('State Bank of India');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  
  // UPI details
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // Card Inputs validation state
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });
  const [cardErrors, setCardErrors] = useState({});

  // React Hook Form for Step 1 Address validations
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: shippingAddress || {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    }
  });

  // Calculate subtotal after product discount first
  const discountedSubtotal = useMemo(() => {
    let acc = 0;
    checkoutItems.forEach((item) => {
      if (!item.product) return;
      const discountPrice = item.product.discountPrice || item.product.price;
      acc += discountPrice * item.quantity;
    });
    return acc;
  }, [checkoutItems]);

  // Calculate pricing totals based on checkout items
  const { subtotal, discount, shipping, tax, grandTotal } = useMemo(() => {
    let subtotalAcc = 0;
    checkoutItems.forEach((item) => {
      if (!item.product) return;
      subtotalAcc += item.product.price * item.quantity;
    });

    const totalDiscount = subtotalAcc - discountedSubtotal;
    const shippingCost = discountedSubtotal > 5000 || discountedSubtotal === 0 ? 0 : 500;
    const taxCost = discountedSubtotal * 0.18;
    
    // Deduct applied coupon discount
    const couponDeduction = appliedCoupon ? appliedCoupon.discount : 0;
    const finalTotal = Math.max(discountedSubtotal + shippingCost + taxCost - couponDeduction, 0);

    return {
      subtotal: subtotalAcc,
      discount: totalDiscount,
      shipping: shippingCost,
      tax: taxCost,
      grandTotal: finalTotal
    };
  }, [checkoutItems, discountedSubtotal, appliedCoupon]);

  // Coupon application handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.warning('Please enter a coupon code.');
      return;
    }
    if (!user) {
      toast.warning('Please login to apply coupons.');
      return;
    }

    setApplyingCoupon(true);
    const config = {
      headers: { Authorization: `Bearer ${user.token}` },
    };

    try {
      const res = await axios.post(
        '/api/coupons/apply',
        { code: couponCode, cartTotal: discountedSubtotal },
        config
      );
      setAppliedCoupon(res.data);
      toast.success(`Coupon "${res.data.code}" applied! Saved ${formatPrice(res.data.discount)}.`);
    } catch (err) {
      setAppliedCoupon(null);
      toast.error(err.response?.data?.message || 'Failed to apply coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon code removed.');
  };

  useEffect(() => {
    document.title = 'Secure Checkout | ShopEz';
  }, []);

  // Protective auth check: redirect non-logged-in users to login page
  useEffect(() => {
    if (!user) {
      toast.warning('Please login first to proceed to checkout.');
      navigate('/login', { state: { from: '/checkout', buyNowItem } });
    }
  }, [user, navigate, buyNowItem]);

  // Step 1: Submit address form
  const onAddressSubmit = (data) => {
    setShippingAddress(data);
    setActiveStep(2);
  };

  // Copy UPI ID helper
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText('shopez@paytm');
    setCopiedUpi(true);
    toast.info('UPI ID copied to clipboard');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Card validation helper
  const validateCardInputs = () => {
    const errs = {};
    if (!cardDetails.name.trim()) errs.name = 'Card Holder Name is required';
    if (!/^\d{16}$/.test(cardDetails.number.replace(/\s+/g, ''))) errs.number = 'Card number must be 16 digits';
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(cardDetails.expiry)) errs.expiry = 'Expiry must be in MM/YY format';
    if (!/^\d{3}$/.test(cardDetails.cvv)) errs.cvv = 'CVV must be 3 digits';
    
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Card input changes
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  // Post actual order to backend database
  const handlePlaceOrder = async (prepaidDetails = {}) => {
    if (!user) {
      toast.warning('Please log in first.');
      return;
    }
    
    setLoading(true);
    
    // Map items list to expected format for schema (product: ID, quantity, price)
    const orderItems = checkoutItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.discountPrice || item.product.price,
    }));

    const config = {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };

    const isPrepaid = paymentMethod !== 'Cash on Delivery';
    const txnId = isPrepaid ? (prepaidDetails.transactionId || 'TXN-' + Math.floor(100000000 + Math.random() * 900000000)) : null;

    try {
      const { data: createdOrder } = await axios.post(
        '/api/orders',
        {
          orderItems,
          shippingAddress: {
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
          },
          paymentMethod,
          totalPrice: Number(grandTotal.toFixed(2)),
          isPaid: isPrepaid,
          paidAt: isPrepaid ? new Date() : null,
          transactionId: txnId,
          paymentTime: isPrepaid ? new Date() : null,
          couponCode: appliedCoupon ? appliedCoupon.code : '',
          couponDiscount: appliedCoupon ? appliedCoupon.discount : 0
        },
        config
      );
      
      // Successfully placed order: clear the cart in context/DB and route to success
      if (!buyNowItem) {
        clearCart();
      }
      setLoading(false);
      setUpiModalOpen(false);
      navigate('/order-success', { 
        state: { 
          orderId: createdOrder._id,
          transactionId: txnId,
          paymentMethod,
          total: grandTotal
        } 
      });
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  // Main pay CTA click
  const handlePaymentSubmission = () => {
    if (paymentMethod === 'Cash on Delivery') {
      handlePlaceOrder();
    } else if (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') {
      if (validateCardInputs()) {
        handlePlaceOrder();
      } else {
        toast.error('Please correct the errors in the card form');
      }
    } else if (paymentMethod === 'UPI') {
      setUpiModalOpen(true);
    } else if (paymentMethod === 'Net Banking') {
      handlePlaceOrder();
    } else if (paymentMethod === 'Wallet') {
      handlePlaceOrder();
    }
  };

  if (checkoutItems.length === 0 && activeStep < 5) {
    return (
      <div className="checkout-page-container">
        <div className="no-products-found">
          <h3>Your Cart is Empty</h3>
          <p>You cannot checkout with an empty cart. Please add items before proceeding.</p>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      {/* Step Indicator Headers */}
      <div className="checkout-step-indicator-bar">
        <div className={`step-item ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">{activeStep > 1 ? <FaCheckCircle /> : '1'}</div>
          <span>Shipping</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${activeStep >= 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">{activeStep > 2 ? <FaCheckCircle /> : '2'}</div>
          <span>Payment</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${activeStep >= 3 ? 'active' : ''} ${activeStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">{activeStep > 3 ? <FaCheckCircle /> : '3'}</div>
          <span>Summary</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${activeStep >= 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <span>Review & Pay</span>
        </div>
      </div>

      <div className="checkout-layout">
        {/* Left Side: Step View forms */}
        <div className="checkout-step-view-card">
          
          {/* STEP 1: Shipping Address Form */}
          {activeStep === 1 && (
            <div className="step-container">
              <h2><FaMapMarkerAlt /> Shipping Address</h2>
              <form onSubmit={handleSubmit(onAddressSubmit)} className="checkout-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Jane Doe"
                      {...register('fullName', { required: 'Full name is required' })}
                    />
                    {errors.fullName && <span className="input-error-msg">{errors.fullName.message}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      {...register('phone', { required: 'Phone number is required' })}
                    />
                    {errors.phone && <span className="input-error-msg">{errors.phone.message}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address">Street Address</label>
                  <input
                    id="address"
                    type="text"
                    placeholder="123 Main St, Apartment 4B"
                    {...register('address', { required: 'Street address is required' })}
                  />
                  {errors.address && <span className="input-error-msg">{errors.address.message}</span>}
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      type="text"
                      placeholder="Bangalore"
                      {...register('city', { required: 'City is required' })}
                    />
                    {errors.city && <span className="input-error-msg">{errors.city.message}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      id="state"
                      type="text"
                      placeholder="Karnataka"
                      {...register('state', { required: 'State is required' })}
                    />
                    {errors.state && <span className="input-error-msg">{errors.state.message}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="postalCode">Pin Code</label>
                    <input
                      id="postalCode"
                      type="text"
                      placeholder="560001"
                      {...register('postalCode', { required: 'Postal code is required' })}
                    />
                    {errors.postalCode && <span className="input-error-msg">{errors.postalCode.message}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    type="text"
                    placeholder="India"
                    {...register('country', { required: 'Country is required' })}
                  />
                  {errors.country && <span className="input-error-msg">{errors.country.message}</span>}
                </div>

                <div className="step-actions-row">
                  <Link to="/cart" className="btn btn-secondary"><FaArrowLeft /> Return to Cart</Link>
                  <button type="submit" className="btn btn-primary">Continue to Payment <FaArrowRight /></button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Payment Method Selection */}
          {activeStep === 2 && (
            <div className="step-container">
              <h2><FaCreditCard /> Select Payment Method</h2>
              <div className="payment-options-grid">
                {[
                  { id: 'cod', name: 'Cash on Delivery', desc: 'Pay with cash upon package arrival (COD)', icon: FaMoneyBillWave },
                  { id: 'cc', name: 'Credit Card', desc: 'Pay securely using Credit Card credentials', icon: FaCreditCard },
                  { id: 'dc', name: 'Debit Card', desc: 'Pay securely using Debit Card credentials', icon: FaCreditCard },
                  { id: 'upi', name: 'UPI', desc: 'Pay using QR Code or instant mobile UPI apps', icon: FaMobileAlt },
                  { id: 'banking', name: 'Net Banking', desc: 'Direct transaction from popular Indian banks', icon: FaUniversity },
                  { id: 'wallet', name: 'Wallet', desc: 'Pay via Paytm, PhonePe Wallet, Amazon Pay, or Mobikwik', icon: FaWallet },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <label key={opt.id} className={`payment-card-option ${paymentMethod === opt.name ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment-method"
                        value={opt.name}
                        checked={paymentMethod === opt.name}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div className="payment-icon-box">
                        <Icon />
                      </div>
                      <div className="payment-details">
                        <strong>{opt.name}</strong>
                        <p>{opt.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="step-actions-row">
                <button className="btn btn-secondary" onClick={() => setActiveStep(1)}><FaArrowLeft /> Back</button>
                <button className="btn btn-primary" onClick={() => setActiveStep(3)}>Continue to Summary <FaArrowRight /></button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Items Summary */}
          {activeStep === 3 && (
            <div className="step-container">
              <h2><FaList /> Order Items Summary</h2>
              <div className="summary-items-list">
                {checkoutItems.map((item) => {
                  if (!item.product) return null;
                  return (
                    <div key={item.product._id} className="summary-item-row">
                      <img 
                        src={item.product.image || '/placeholder.png'} 
                        alt={item.product.name} 
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                      <div className="summary-item-info">
                        <h4>{item.product.name}</h4>
                        <span>Brand: {item.product.brand}</span>
                        <p style={{ marginTop: '6px' }}>Qty: {item.quantity}</p>
                      </div>
                      <div className="price-item-wrap">
                        <Price price={item.product.price} discountPrice={item.product.discountPrice} size="sm" />
                        <span className="summary-line-total">
                          Total: {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="step-actions-row">
                <button className="btn btn-secondary" onClick={() => setActiveStep(2)}><FaArrowLeft /> Back</button>
                <button className="btn btn-primary" onClick={() => setActiveStep(4)}>Continue to Review <FaArrowRight /></button>
              </div>
            </div>
          )}

          {/* STEP 4: Review and Submit Order */}
          {activeStep === 4 && (
            <div className="step-container">
              <h2><FaEye /> Review & Pay</h2>
              
              <div className="review-grids">
                {/* Address Summary */}
                <div className="review-summary-block">
                  <h4>Shipping Address</h4>
                  {shippingAddress && (
                    <p>
                      <strong>{shippingAddress.fullName}</strong><br />
                      Phone: {shippingAddress.phone}<br />
                      {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}, {shippingAddress.country}
                    </p>
                  )}
                  <button className="edit-step-btn" onClick={() => setActiveStep(1)}>Edit Address</button>
                </div>

                {/* Payment Summary */}
                <div className="review-summary-block">
                  <h4>Payment Method Selected</h4>
                  <p><strong>{paymentMethod}</strong></p>
                  <button className="edit-step-btn" onClick={() => setActiveStep(2)}>Edit Payment Method</button>
                </div>
              </div>

              {/* Specific Payment Forms */}
              <div className="payment-interactive-section">
                {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
                  <div className="card-payment-form-card">
                    <h4>Card Information</h4>
                    <div className="card-form-grid">
                      <div className="form-group">
                        <label>Card Holder Name</label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Cardholder Name"
                          value={cardDetails.name}
                          onChange={handleCardInputChange}
                        />
                        {cardErrors.name && <span className="input-error-msg">{cardErrors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label>Card Number</label>
                        <input
                          type="text"
                          name="number"
                          placeholder="1234 5678 1234 5678"
                          maxLength="16"
                          value={cardDetails.number}
                          onChange={handleCardInputChange}
                        />
                        {cardErrors.number && <span className="input-error-msg">{cardErrors.number}</span>}
                      </div>

                      <div className="form-row-two" style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Expiry Date (MM/YY)</label>
                          <input
                            type="text"
                            name="expiry"
                            placeholder="MM/YY"
                            maxLength="5"
                            value={cardDetails.expiry}
                            onChange={handleCardInputChange}
                          />
                          {cardErrors.expiry && <span className="input-error-msg">{cardErrors.expiry}</span>}
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>CVV</label>
                          <input
                            type="password"
                            name="cvv"
                            placeholder="123"
                            maxLength="3"
                            value={cardDetails.cvv}
                            onChange={handleCardInputChange}
                          />
                          {cardErrors.cvv && <span className="input-error-msg">{cardErrors.cvv}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Net Banking' && (
                  <div className="bank-selection-card">
                    <h4>Select Your Bank</h4>
                    <select 
                      value={selectedBank} 
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="bank-select-dropdown"
                    >
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'Wallet' && (
                  <div className="wallet-selection-card">
                    <h4>Select Wallet</h4>
                    <div className="wallets-grid">
                      {['Paytm', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'].map((w) => (
                        <label key={w} className={`wallet-row-opt ${selectedWallet === w ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="wallet-opt"
                            value={w}
                            checked={selectedWallet === w}
                            onChange={(e) => setSelectedWallet(e.target.value)}
                          />
                          <span>{w}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'UPI' && (
                  <div className="upi-init-box">
                    <p className="upi-init-p">Clicking "Proceed to Pay" will launch the secure UPI QR code and payment verification modal.</p>
                  </div>
                )}

                {paymentMethod === 'Cash on Delivery' && (
                  <div className="cod-init-box">
                    <p className="cod-init-p">Your order is ready. Click "Place Order (COD)" to complete the purchase immediately.</p>
                  </div>
                )}
              </div>

              <div className="security-notice-box">
                <FaShieldAlt />
                <span>Your order transaction is protected using bank-grade secure protocols.</span>
              </div>

              <div className="step-actions-row">
                <button className="btn btn-secondary" onClick={() => setActiveStep(3)} disabled={loading}><FaArrowLeft /> Back</button>
                <button className="btn btn-primary place-order-btn" onClick={handlePaymentSubmission} disabled={loading}>
                  {loading ? 'Processing...' : (
                    paymentMethod === 'Cash on Delivery' ? 'Place Order (COD)' :
                    paymentMethod === 'UPI' ? 'Proceed to Pay (UPI)' : 'Pay Now & Place Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Totals Summary sticky bar */}
        <div className="checkout-totals-sidebar">
          <h3>Order Pricing</h3>
          <div className="totals-breakdown">
            <div className="total-row">
              <span>Subtotal</span>
              <Price price={subtotal} size="sm" />
            </div>
            {discount > 0 && (
              <div className="total-row discount-row-ui">
                <span>Discount</span>
                <span className="price-discount-val">- {formatPrice(discount)}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="total-row discount-row-ui coupon-deduction-row">
                <span>Coupon ({appliedCoupon.code})</span>
                <span className="price-discount-val">- {formatPrice(appliedCoupon.discount)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Shipping Charge</span>
              {shipping === 0 ? <span className="free-shipping-lbl">FREE</span> : <Price price={shipping} size="sm" />}
            </div>
            <div className="total-row">
              <span>Tax (GST 18%)</span>
              <Price price={tax} size="sm" />
            </div>
            <hr />
            <div className="total-row grand-total">
              <span>Grand Total</span>
              <Price price={grandTotal} size="lg" />
            </div>
            <div className="coupon-apply-block">
              <h4>Promo Coupon</h4>
              {appliedCoupon ? (
                <div className="applied-coupon-pill">
                  <span className="coupon-code-name">{appliedCoupon.code} Applied</span>
                  <button className="remove-coupon-btn" onClick={handleRemoveCoupon}>
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={applyingCoupon}
                  />
                  <button
                    className="btn btn-primary apply-coupon-btn"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* UPI PAYMENT MODAL */}
      {upiModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card small upi-modal">
            <div className="modal-header-row">
              <h3><FaQrcode /> Scan & Pay via UPI</h3>
              <button className="close-modal-trigger" onClick={() => setUpiModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="upi-modal-body">
              <div className="amount-payable-badge">
                <span>Amount Payable</span>
                <h3>{formatPrice(grandTotal)}</h3>
              </div>

              {/* Styled Mock SVG QR Code */}
              <div className="qr-code-graphic-wrapper">
                <svg width="180" height="180" viewBox="0 0 100 100" className="qr-code-svg">
                  {/* Outer boundaries */}
                  <rect x="0" y="0" width="100" height="100" fill="#ffffff" rx="8" />
                  
                  {/* Top-Left Finder Pattern */}
                  <rect x="8" y="8" width="22" height="22" fill="#000000" />
                  <rect x="11" y="11" width="16" height="16" fill="#ffffff" />
                  <rect x="14" y="14" width="10" height="10" fill="#000000" />

                  {/* Top-Right Finder Pattern */}
                  <rect x="70" y="8" width="22" height="22" fill="#000000" />
                  <rect x="73" y="11" width="16" height="16" fill="#ffffff" />
                  <rect x="76" y="14" width="10" height="10" fill="#000000" />

                  {/* Bottom-Left Finder Pattern */}
                  <rect x="8" y="70" width="22" height="22" fill="#000000" />
                  <rect x="11" y="73" width="16" height="16" fill="#ffffff" />
                  <rect x="14" y="76" width="10" height="10" fill="#000000" />

                  {/* Visual mockup of random QR dots */}
                  <path d="M 40 10 H 45 V 15 H 40 Z M 50 8 H 60 V 12 H 50 Z M 45 20 H 55 V 25 H 45 Z" fill="#000000" />
                  <path d="M 8 40 H 15 V 45 H 8 Z M 20 45 H 35 V 50 H 20 Z M 12 55 H 25 V 60 H 12 Z" fill="#000000" />
                  <path d="M 40 40 H 60 V 60 H 40 Z M 45 45 H 55 V 55 H 45 Z" fill="#3b82f6" /> {/* Brand accent blue center */}
                  <path d="M 70 40 H 75 V 45 H 70 Z M 80 45 H 90 V 50 H 80 Z M 75 55 H 85 V 60 H 75 Z" fill="#000000" />
                  <path d="M 40 70 H 45 V 75 H 40 Z M 50 75 H 65 V 80 H 50 Z M 45 85 H 55 V 90 H 45 Z" fill="#000000" />
                  <path d="M 70 70 H 75 V 75 H 70 Z M 80 75 H 92 V 80 H 80 Z M 75 85 H 85 V 92 H 75 Z" fill="#000000" />
                </svg>
              </div>

              {/* UPI ID Copy Field */}
              <div className="upi-id-copy-row">
                <span className="upi-id-label">UPI ID: <strong>shopez@paytm</strong></span>
                <button className="copy-upi-btn" onClick={handleCopyUpiId}>
                  {copiedUpi ? <FaCheck style={{ color: '#22c55e' }} /> : <FaCopy />}
                </button>
              </div>

              <div className="upi-apps-icons-list">
                <span className="apps-lbl">Supported UPI Apps</span>
                <div className="apps-grid">
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
                    <div key={app} className="upi-app-btn-mock" title={`Pay via ${app}`}>
                      <div className="app-mock-icon">{app.charAt(0)}</div>
                      <span className="app-mock-name">{app.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                className="btn btn-primary completed-payment-btn" 
                onClick={() => handlePlaceOrder()}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'I have completed payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
