import React from 'react';
import { formatPrice } from '../utils/priceFormatter';
import './Price.css';

const Price = ({ price, discountPrice, size = 'md' }) => {
  const original = Number(price) || 0;
  const current = Number(discountPrice) || original;
  
  const hasDiscount = current < original && current > 0;
  const discountPercentage = hasDiscount 
    ? Math.round(((original - current) / original) * 100) 
    : 0;

  return (
    <div className={`price-container price-size-${size}`}>
      <span className="price-current">{formatPrice(current)}</span>
      {hasDiscount && (
        <>
          <span className="price-original">{formatPrice(original)}</span>
          <span className="price-discount-badge">{discountPercentage}% OFF</span>
        </>
      )}
    </div>
  );
};

export default Price;
