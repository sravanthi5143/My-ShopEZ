import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination-container">
      {/* Prev Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn arrow-btn"
        aria-label="Previous Page"
      >
        <FaChevronLeft />
      </button>

      {/* Pages Numbers */}
      <div className="pagination-numbers">
        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`pagination-btn num-btn ${currentPage === num ? 'active' : ''}`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn arrow-btn"
        aria-label="Next Page"
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

export default React.memo(Pagination);
