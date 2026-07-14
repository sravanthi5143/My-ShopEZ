import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaTrash, 
  FaShoppingCart, 
  FaEye, 
  FaHeartBroken, 
  FaArrowLeft, 
  FaCheckCircle, 
  FaTimesCircle 
} from 'react-icons/fa';
import Rating from '../components/Rating';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { formatPrice } from '../utils/priceFormatter';
import Price from '../components/Price';
import './Wishlist.css';

const Wishlist = () => {
  const { addToCart } = useContext(CartContext);
  const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);

  const handleRemoveFromWishlist = async (id, name) => {
    try {
      await removeFromWishlist(id);
    } catch (err) {
      toast.error(err || 'Failed to remove item');
    }
  };

  const handleAddToCartFromWishlist = async (product) => {
    try {
      const res = await addToCart(product._id, 1);
      if (!res) return;
      await removeFromWishlist(product._id);
      toast.success(`"${product.name}" moved to cart!`);
    } catch (err) {
      toast.error(err || 'Failed to move item to cart');
    }
  };

  return (
    <div className="wishlist-page-container">
      <div className="wishlist-header">
        <h2>My Wishlist ({wishlistItems.length})</h2>
        <Link to="/products" className="btn btn-secondary btn-sm">
          <FaArrowLeft /> Back to Shop
        </Link>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist-card">
          <FaHeartBroken className="heart-broken-icon" />
          <h3>Your Wishlist is Empty</h3>
          <p>Explore our premium collections and save your favorite products here.</p>
          <Link to="/products" className="btn btn-primary">Start Browsing</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => {
            const { _id, name, brand, price, discountPrice, rating, numReviews, image, stock } = item;
            return (
              <div key={_id} className="wishlist-item-card">
                <button 
                  className="wishlist-delete-btn" 
                  onClick={() => handleRemoveFromWishlist(_id, name)}
                  aria-label="Remove item"
                >
                  <FaTrash />
                </button>

                <div className="wishlist-img-wrapper">
                  <img 
                    src={image || '/placeholder.png'} 
                    alt={name} 
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
                  />
                </div>

                <div className="wishlist-item-details">
                  <span className="wishlist-brand">{brand}</span>
                  <h4 className="wishlist-name">{name}</h4>
                  
                  <Rating value={rating} text={`(${numReviews})`} />

                  {/* Price Row */}
                  <div className="wishlist-price-row">
                    <Price price={price} discountPrice={discountPrice} size="sm" />
                  </div>

                {/* Stock Status */}
                <div className="wishlist-stock-status">
                  {stock > 0 ? (
                    <span className="stock-in-stock">
                      <FaCheckCircle /> In Stock
                    </span>
                  ) : (
                    <span className="stock-out-of-stock">
                      <FaTimesCircle /> Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="wishlist-actions-footer">
                <button
                  className="btn btn-primary wishlist-action-btn"
                  onClick={() => handleAddToCartFromWishlist(item)}
                  disabled={stock === 0}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <Link to={`/product/${_id}`} className="btn btn-secondary wishlist-action-btn view-btn">
                  <FaEye /> View Product
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Bottom Action Footer */}
      <div className="wishlist-bottom-footer">
        <Link to="/products" className="btn btn-secondary">
          <FaArrowLeft /> Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default Wishlist;
