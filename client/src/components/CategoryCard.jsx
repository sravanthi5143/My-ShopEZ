import React from 'react';
import { Link } from 'react-router-dom';
import './CategoryCard.css';

const CategoryCard = ({ name, image, icon: Icon, path }) => {
  return (
    <Link to={path} className="category-card">
      <div className="category-image-wrapper">
        <img 
          src={image || '/placeholder.png'} 
          alt={name}
          className="category-image"
          onError={(e) => { e.target.src = '/placeholder.png'; }}
        />
        <div className="category-overlay"></div>
      </div>
      <div className="category-details">
        <div className="category-icon-circle">
          {Icon && <Icon className="category-icon" />}
        </div>
        <h3 className="category-card-title">{name}</h3>
        <button className="category-cta-btn">Explore Now</button>
      </div>
    </Link>
  );
};

export default React.memo(CategoryCard);
