import React from 'react';
import { FaSearch } from 'react-icons/fa';
import './SearchBar.css';

const SearchBar = ({ value, onChange, placeholder = "Search products..." }) => {
  return (
    <div className="search-bar-wrapper">
      <input
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search products, brands, and categories"
      />
      <FaSearch className="search-bar-icon" />
    </div>
  );
};

export default React.memo(SearchBar);
