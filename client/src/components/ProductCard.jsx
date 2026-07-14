import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Rating from './Rating';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { formatPrice } from '../utils/priceFormatter';
import Price from './Price';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const {
    _id,
    name,
    brand,
    price,
    discountPrice,
    rating,
    numReviews,
    image,
    stock,
  } = product;

  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);

  const isWishlisted = isInWishlist(_id);

  // Calculate discount percentage if original price is greater than discount price
  const discountPercentage = 
    price && discountPrice && price > discountPrice 
      ? Math.round(((price - discountPrice) / price) * 100)
      : null;

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    try {
      if (isWishlisted) {
        await removeFromWishlist(_id);
      } else {
        await addToWishlist(_id);
      }
    } catch (err) {
      toast.error(err || 'Failed to update wishlist');
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    try {
      const res = await addToCart(_id, 1);
      if (!res) return; // Action aborted (e.g., not logged in)
      toast.success(`${name} added to cart!`);
    } catch (err) {
      toast.error(err || 'Failed to add item');
    }
  };

  return (
    <div className="product-card">
      <Link to={`/product/${_id}`} className="product-card-link">
        {/* Product Image & Badges */}
        <div className="product-image-container">
          <img 
            src={image || '/placeholder.png'} 
            alt={name} 
            loading="lazy" 
            onError={(e) => { e.target.src = '/placeholder.png'; }}
          />
          
          {discountPercentage && (
            <span className="discount-badge">-{discountPercentage}%</span>
          )}
 
          <button 
            className={`wishlist-toggle-btn ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlistClick}
            aria-label="Add to wishlist"
          >
            {isWishlisted ? <FaHeart className="wishlist-icon-filled" /> : <FaRegHeart />}
          </button>
        </div>
 
        {/* Product Info */}
        <div className="product-info">
          <span className="product-brand">{brand}</span>
          <h4 className="product-name" title={name}>{name}</h4>
          
          <Rating value={rating} text={`(${numReviews})`} />
 
          {/* Price Comparisons */}
          <div className="price-row">
            <Price price={price} discountPrice={discountPrice} size="sm" />
          </div>
        </div>
      </Link>

      {/* Add To Cart Button */}
      <div className="product-card-footer">
        <button 
          className="add-to-cart-btn" 
          onClick={handleAddToCart}
          disabled={stock === 0}
        >
          <FaShoppingCart /> {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
