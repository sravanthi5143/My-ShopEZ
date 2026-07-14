import React, { useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaTrash, 
  FaPlus, 
  FaMinus, 
  FaShoppingCart, 
  FaArrowLeft, 
  FaChevronRight,
  FaPercentage,
  FaSignInAlt
} from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { CartSkeleton } from '../components/Skeletons';
import { formatPrice } from '../utils/priceFormatter';
import Price from '../components/Price';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();

  // 1. Context Triggers
  const { user } = useContext(AuthContext);
  const { cartItems, loading, updateCartItem, removeFromCart } = useContext(CartContext);

  React.useEffect(() => {
    document.title = 'My Shopping Cart | ShopEz';
  }, []);

  // Adjust item quantity in backend database
  const handleQtyChange = async (productId, quantity, maxStock, type) => {
    let newQty = quantity;
    if (type === 'inc' && quantity < maxStock) {
      newQty += 1;
    } else if (type === 'dec' && quantity > 1) {
      newQty -= 1;
    }
    
    if (newQty !== quantity) {
      try {
        await updateCartItem(productId, newQty);
      } catch (err) {
        toast.error(err || 'Failed to update quantity');
      }
    }
  };

  // Remove item from database
  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error(err || 'Failed to remove item');
    }
  };

  // Calculate pricing elements dynamically based on backend cart items
  const { subtotal, discount, shipping, tax, grandTotal } = useMemo(() => {
    let subtotalAcc = 0;
    let discountedSubtotalAcc = 0;

    cartItems.forEach((item) => {
      if (!item.product) return;
      const originalPrice = item.product.price;
      const discountPrice = item.product.discountPrice || item.product.price;
      
      subtotalAcc += originalPrice * item.quantity;
      discountedSubtotalAcc += discountPrice * item.quantity;
    });

    const totalDiscount = subtotalAcc - discountedSubtotalAcc;
    const shippingCost = discountedSubtotalAcc > 5000 || discountedSubtotalAcc === 0 ? 0 : 500;
    const taxCost = discountedSubtotalAcc * 0.18;
    const finalTotal = discountedSubtotalAcc + shippingCost + taxCost;

    return {
      subtotal: subtotalAcc,
      discount: totalDiscount,
      shipping: shippingCost,
      tax: taxCost,
      grandTotal: finalTotal
    };
  }, [cartItems]);

  const handleCheckoutRedirect = () => {
    navigate('/checkout');
  };

  if (loading && cartItems.length === 0) {
    return <CartSkeleton />;
  }

  // 1. User Session Missing State
  if (!user) {
    return (
      <div className="cart-empty-state">
        <div className="empty-cart-circle">
          <FaShoppingCart className="empty-cart-icon" />
        </div>
        <h2>Please Log In</h2>
        <p>You must be logged in to view your shopping cart and place orders.</p>
        <Link to="/login" className="btn btn-primary">
          Login Now <FaSignInAlt style={{ marginLeft: '8px' }} />
        </Link>
      </div>
    );
  }

  // 2. Empty Cart Render
  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-state">
        <div className="empty-cart-circle">
          <FaShoppingCart className="empty-cart-icon" />
        </div>
        <h2>Your Cart is Empty</h2>
        <p>Before you can checkout, you must add some products to your shopping cart.</p>
        <Link to="/products" className="btn btn-primary">
          <FaArrowLeft /> Continue Shopping
        </Link>
      </div>
    );
  }

  // 3. Populated Cart Render
  return (
    <div className="cart-page-container">
      <h1>Shopping Cart</h1>

      <div className="cart-main-layout">
        {/* Left Side: Items List */}
        <div className="cart-items-section">
          {cartItems.map((item) => {
            if (!item.product) return null;
            const {
              product: { _id: prodId, name, brand, price, discountPrice, image, stock },
              quantity
            } = item;

            const activePrice = discountPrice || price;
            const itemSavings = price > discountPrice ? (price - discountPrice) * quantity : 0;

            return (
              <div key={prodId} className="cart-item-row">
                {/* Image */}
                <div className="cart-item-img-container">
                   <img 
                    src={image || '/placeholder.png'} 
                    alt={name} 
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
                  />
                </div>

                {/* Info Column */}
                <div className="cart-item-info">
                  <span className="cart-item-brand">{brand}</span>
                  <Link to={`/product/${prodId}`} className="cart-item-name-link">
                    <h3 className="cart-item-name">{name}</h3>
                  </Link>
                  
                  {/* Price info */}
                  <div className="cart-item-pricing">
                    <Price price={price} discountPrice={discountPrice} size="sm" />
                  </div>
                  
                  {itemSavings > 0 && (
                    <span className="cart-item-savings-badge">
                      <FaPercentage /> Saved {formatPrice(itemSavings)}
                    </span>
                  )}
                </div>

                {/* Quantity picker */}
                <div className="cart-item-qty-actions">
                  <div className="qty-picker">
                    <button onClick={() => handleQtyChange(prodId, quantity, stock, 'dec')} disabled={quantity <= 1}>
                      <FaMinus />
                    </button>
                    <input type="text" value={quantity} readOnly />
                    <button onClick={() => handleQtyChange(prodId, quantity, stock, 'inc')} disabled={quantity >= stock}>
                      <FaPlus />
                    </button>
                  </div>
                  <span className="stock-info-text">Max stock: {stock}</span>
                </div>

                {/* Subtotal & Delete */}
                <div className="cart-item-subtotal-actions">
                  <span className="cart-item-subtotal-price">
                    <Price price={activePrice * quantity} size="sm" />
                  </span>
                  <button 
                    className="cart-item-remove-btn" 
                    onClick={() => handleRemoveItem(prodId)}
                    title="Remove item"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Continue Shopping button */}
          <div className="cart-actions-row">
            <Link to="/products" className="btn btn-secondary">
              <FaArrowLeft /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Side: Summary Panel */}
        <div className="cart-summary-section">
          <h3>Order Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <Price price={subtotal} size="sm" />
            </div>
            {discount > 0 && (
              <div className="summary-row discount-row">
                <span>Discount</span>
                <span className="price-discount-val">- {formatPrice(discount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              {shipping === 0 ? <span className="free-shipping-lbl">FREE</span> : <Price price={shipping} size="sm" />}
            </div>
            <div className="summary-row">
              <span>Tax (GST 18%)</span>
              <Price price={tax} size="sm" />
            </div>
            
            <hr className="summary-divider" />
            
            <div className="summary-row total-row">
              <span>Grand Total</span>
              <Price price={grandTotal} size="lg" />
            </div>
          </div>

          <button className="btn btn-primary checkout-btn" onClick={handleCheckoutRedirect}>
            Proceed to Checkout <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
