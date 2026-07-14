import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container" role="status" aria-label="Loading content">
      <div className="premium-spinner"></div>
    </div>
  );
};

export default Loader;
