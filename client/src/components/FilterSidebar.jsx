import React, { useState } from 'react';
import { FaStar, FaRegStar, FaSearch, FaCheck } from 'react-icons/fa';
import './FilterSidebar.css';
import { formatPrice } from '../utils/priceFormatter';

const FilterSidebar = ({
  selectedCategories = [],
  onCategoryToggle,
  selectedBrands = [],
  onBrandToggle,
  priceRange = { min: 0, max: 300000 },
  onPriceChange,
  selectedRating = 0,
  onRatingSelect,
  inStockOnly = false,
  onStockToggle,
  discountOnly = false,
  onDiscountToggle,
  onClearFilters,
  categoriesList = [],
  brandsList = [],
  activeFilterCount = 0,
}) => {
  const [brandSearch, setBrandSearch] = useState('');
  const [minPriceInput, setMinPriceInput] = useState(priceRange.min);
  const [maxPriceInput, setMaxPriceInput] = useState(priceRange.max);

  // Sync inputs if props change outside
  React.useEffect(() => {
    setMinPriceInput(priceRange.min);
    setMaxPriceInput(priceRange.max);
  }, [priceRange.min, priceRange.max]);

  const filteredBrands = brandsList.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const handlePriceApply = (newMin, newMax) => {
    const validMin = Math.max(0, Number(newMin) || 0);
    const validMax = Math.max(validMin, Number(newMax) || 300000);
    setMinPriceInput(validMin);
    setMaxPriceInput(validMax);
    onPriceChange({ min: validMin, max: validMax });
  };

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <div className="filter-title-wrap">
          <h3>Filters</h3>
          {activeFilterCount > 0 && (
            <span className="active-filter-badge">{activeFilterCount}</span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={onClearFilters} className="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>

      {/* 1. Category Filter (Multi-Select) */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>Category</h4>
          {selectedCategories.length > 0 && (
            <span className="filter-count-badge">{selectedCategories.length}</span>
          )}
        </div>
        <div className="filter-options">
          {categoriesList.map((cat) => {
            const isChecked = selectedCategories.includes(cat.name);
            return (
              <label
                key={cat._id || cat.name}
                className={`filter-checkbox-label ${isChecked ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onCategoryToggle(cat.name)}
                />
                <span className="checkbox-custom">
                  {isChecked && <FaCheck className="check-icon" />}
                </span>
                <span className="checkbox-text">{cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Brand Filter (Multi-Select with quick filter search) */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>Brand</h4>
          {selectedBrands.length > 0 && (
            <span className="filter-count-badge">{selectedBrands.length}</span>
          )}
        </div>

        {brandsList.length > 5 && (
          <div className="filter-search-wrap">
            <FaSearch className="filter-search-icon" />
            <input
              type="text"
              placeholder="Search brand..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="filter-search-input"
            />
          </div>
        )}

        <div className="filter-options">
          {filteredBrands.length > 0 ? (
            filteredBrands.map((brand) => {
              const isChecked = selectedBrands.includes(brand);
              return (
                <label
                  key={brand}
                  className={`filter-checkbox-label ${isChecked ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onBrandToggle(brand)}
                  />
                  <span className="checkbox-custom">
                    {isChecked && <FaCheck className="check-icon" />}
                  </span>
                  <span className="checkbox-text">{brand}</span>
                </label>
              );
            })
          ) : (
            <div className="no-filter-match">No brands match "{brandSearch}"</div>
          )}
        </div>
      </div>

      {/* 3. Price Range Filter */}
      <div className="filter-group">
        <h4>Price Range</h4>
        <div className="price-slider-container">
          <input
            type="range"
            min="0"
            max="300000"
            step="1000"
            value={priceRange.max}
            onChange={(e) =>
              handlePriceApply(priceRange.min, Number(e.target.value))
            }
            className="price-slider"
          />
          <div className="price-inputs-row">
            <div className="price-input-box">
              <span>₹</span>
              <input
                type="number"
                min="0"
                max="300000"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                onBlur={() => handlePriceApply(minPriceInput, maxPriceInput)}
                placeholder="Min"
              />
            </div>
            <span className="price-separator">to</span>
            <div className="price-input-box">
              <span>₹</span>
              <input
                type="number"
                min="0"
                max="300000"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                onBlur={() => handlePriceApply(minPriceInput, maxPriceInput)}
                placeholder="Max"
              />
            </div>
          </div>
          <div className="price-values">
            <span>{formatPrice(priceRange.min)}</span>
            <span className="current-price-val">
              {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Rating Filter */}
      <div className="filter-group">
        <h4>Customer Rating</h4>
        <div className="rating-filter-options">
          {[4, 3, 2, 1].map((stars) => {
            const isActive = selectedRating === stars;
            return (
              <button
                key={stars}
                onClick={() => onRatingSelect(isActive ? 0 : stars)}
                className={`rating-filter-btn ${isActive ? 'active' : ''}`}
                type="button"
              >
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                      {star <= stars ? (
                        <FaStar className="star" />
                      ) : (
                        <FaRegStar className="empty-star" />
                      )}
                    </span>
                  ))}
                </div>
                <span>& Up</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Availability & Discount Filters */}
      <div className="filter-group">
        <h4>Availability & Offers</h4>
        <label className={`filter-checkbox-label ${inStockOnly ? 'selected' : ''}`}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onStockToggle}
          />
          <span className="checkbox-custom">
            {inStockOnly && <FaCheck className="check-icon" />}
          </span>
          <span className="checkbox-text">In Stock Only</span>
        </label>
        <label className={`filter-checkbox-label ${discountOnly ? 'selected' : ''}`}>
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={onDiscountToggle}
          />
          <span className="checkbox-custom">
            {discountOnly && <FaCheck className="check-icon" />}
          </span>
          <span className="checkbox-text">Discounted Only</span>
        </label>
      </div>
    </aside>
  );
};

export default React.memo(FilterSidebar);
