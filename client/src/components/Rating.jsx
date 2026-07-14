import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import './Rating.css';

const Rating = ({ value, text }) => {
  return (
    <div className="rating">
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => {
          return (
            <span key={star}>
              {value >= star ? (
                <FaStar className="star-icon" />
              ) : value >= star - 0.5 ? (
                <FaStarHalfAlt className="star-icon" />
              ) : (
                <FaRegStar className="star-icon" />
              )}
            </span>
          );
        })}
      </div>
      {text && <span className="rating-text">{text}</span>}
    </div>
  );
};

export default React.memo(Rating);
