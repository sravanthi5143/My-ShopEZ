import React from 'react';
import { Link } from 'react-router-dom';
import { FaCompass, FaHome, FaShoppingBag } from 'react-icons/fa';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page-container">
      <div className="not-found-card">
        {/* Stylized Compass Illustration */}
        <div className="not-found-illustration-wrapper">
          <FaCompass className="not-found-icon-spin" />
          <h1 className="not-found-giant-text">404</h1>
        </div>

        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-description">
          Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back on track.
        </p>

        {/* Action Triggers */}
        <div className="not-found-actions-row">
          <Link to="/" className="btn btn-primary not-found-btn">
            <FaHome /> Go Home
          </Link>
          <Link to="/products" className="btn btn-secondary not-found-btn">
            <FaShoppingBag /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
