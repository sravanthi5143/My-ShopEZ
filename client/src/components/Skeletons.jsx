import React from 'react';
import './Skeletons.css';

// 1. Shimmer Base Block Helper
const Shimmer = ({ className = '' }) => (
  <div className={`skeleton-shimmer ${className}`}></div>
);

// 2. Reusable Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <Shimmer className="skeleton-img-box" />
      <div className="skeleton-info-box">
        <Shimmer className="skeleton-line w-40" />
        <Shimmer className="skeleton-line w-80 h-16" />
        <Shimmer className="skeleton-line w-50" />
        <Shimmer className="skeleton-line w-60 h-20" />
      </div>
      <div className="skeleton-footer-box">
        <Shimmer className="skeleton-btn-box" />
      </div>
    </div>
  );
};

// 3. Reusable Product Details Page Skeleton
export const ProductDetailsSkeleton = () => {
  return (
    <div className="skeleton-details-page">
      <Shimmer className="skeleton-line w-20 h-16" />
      <div className="skeleton-details-grid">
        {/* Left image gallery */}
        <div className="skeleton-gallery-col">
          <Shimmer className="skeleton-large-img" />
          <div className="skeleton-thumbs-row">
            <Shimmer className="skeleton-thumb-box" />
            <Shimmer className="skeleton-thumb-box" />
            <Shimmer className="skeleton-thumb-box" />
          </div>
        </div>
        {/* Right details specifications panel */}
        <div className="skeleton-details-panel">
          <Shimmer className="skeleton-line w-30" />
          <Shimmer className="skeleton-line w-80 h-32" />
          <Shimmer className="skeleton-line w-40 h-20" />
          <Shimmer className="skeleton-line w-50 h-24" />
          <hr className="skeleton-divider" />
          <Shimmer className="skeleton-line w-90 h-80" />
          <Shimmer className="skeleton-line w-60 h-24" />
          <div className="skeleton-btn-group">
            <Shimmer className="skeleton-btn-box flex-grow" />
            <Shimmer className="skeleton-btn-box flex-grow" />
            <Shimmer className="skeleton-btn-box w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Reusable Home Page Skeleton
export const HomeSkeleton = () => {
  return (
    <div className="skeleton-home-page">
      {/* Hero */}
      <Shimmer className="skeleton-hero-banner" />
      {/* Values props bar */}
      <div className="skeleton-value-props-bar">
        <Shimmer className="skeleton-prop-block" />
        <Shimmer className="skeleton-prop-block" />
        <Shimmer className="skeleton-prop-block" />
        <Shimmer className="skeleton-prop-block" />
      </div>
      {/* Section Grid */}
      <div className="skeleton-section">
        <div className="skeleton-align-center">
          <Shimmer className="skeleton-line w-30 h-20" />
          <Shimmer className="skeleton-line w-50" />
        </div>
        <div className="skeleton-grid-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </div>
    </div>
  );
};

// 5. Reusable Shopping Cart Page Skeleton
export const CartSkeleton = () => {
  return (
    <div className="skeleton-cart-page">
      <Shimmer className="skeleton-line w-30 h-24" />
      <div className="skeleton-cart-grid">
        {/* Cart items */}
        <div className="skeleton-cart-list">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-cart-row">
              <Shimmer className="skeleton-thumb-box" />
              <div className="skeleton-info-box">
                <Shimmer className="skeleton-line w-40" />
                <Shimmer className="skeleton-line w-80 h-16" />
              </div>
              <Shimmer className="skeleton-btn-box w-30" />
              <Shimmer className="skeleton-line w-20" />
            </div>
          ))}
        </div>
        {/* Summary sidebar */}
        <div className="skeleton-cart-summary">
          <Shimmer className="skeleton-line w-50 h-20" />
          <Shimmer className="skeleton-line w-80" />
          <Shimmer className="skeleton-line w-70" />
          <Shimmer className="skeleton-line w-80 h-24" />
          <Shimmer className="skeleton-btn-box" />
        </div>
      </div>
    </div>
  );
};

// 6. Reusable Admin Dashboard Page Skeleton
export const AdminSkeleton = () => {
  return (
    <div className="skeleton-admin-page">
      {/* Sidebar Skeletons */}
      <div className="skeleton-admin-sidebar">
        <Shimmer className="skeleton-line w-80 h-24" />
        <hr className="skeleton-divider" />
        <Shimmer className="skeleton-line w-90 h-20" />
        <Shimmer className="skeleton-line w-90 h-20" />
        <Shimmer className="skeleton-line w-90 h-20" />
        <Shimmer className="skeleton-line w-90 h-20" />
      </div>
      {/* Main Content Skeletons */}
      <div className="skeleton-admin-main">
        <Shimmer className="skeleton-line w-30 h-24" />
        {/* Stat Cards */}
        <div className="skeleton-grid-4">
          <Shimmer className="skeleton-stat-card" />
          <Shimmer className="skeleton-stat-card" />
          <Shimmer className="skeleton-stat-card" />
          <Shimmer className="skeleton-stat-card" />
        </div>
        {/* Charts & tables rows */}
        <div className="skeleton-admin-blocks">
          <Shimmer className="skeleton-chart-box" />
          <Shimmer className="skeleton-alerts-box" />
        </div>
      </div>
    </div>
  );
};
