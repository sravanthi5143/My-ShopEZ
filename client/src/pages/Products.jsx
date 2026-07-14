import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { ProductCardSkeleton } from '../components/Skeletons';
import { formatPrice } from '../utils/priceFormatter';
import './Products.css';

const DEFAULT_MAX_PRICE = 300000;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Data Loading State
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState([]);
  const [allBrands, setAllBrands] = useState([]);

  // 2. Filter States initialized from URL params
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const raw = searchParams.get('categories') || searchParams.get('category');
    return raw ? raw.split(',').map((c) => c.trim()).filter(Boolean) : [];
  });

  const [selectedBrands, setSelectedBrands] = useState(() => {
    const raw = searchParams.get('brands') || searchParams.get('brand');
    return raw ? raw.split(',').map((b) => b.trim()).filter(Boolean) : [];
  });

  const [priceRange, setPriceRange] = useState(() => {
    const minP = Number(searchParams.get('minPrice')) || 0;
    const maxP = Number(searchParams.get('maxPrice')) || DEFAULT_MAX_PRICE;
    return { min: minP, max: maxP };
  });

  const [selectedRating, setSelectedRating] = useState(() => {
    return Number(searchParams.get('rating')) || 0;
  });

  const [inStockOnly, setInStockOnly] = useState(() => {
    return searchParams.get('stock') === 'inStock' || searchParams.get('inStock') === 'true';
  });

  const [discountOnly, setDiscountOnly] = useState(() => {
    return searchParams.get('discount') === 'true';
  });

  // 3. Search & Sort States
  const initialSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'best-selling');

  // 4. Pagination State
  const [currentPage, setCurrentPage] = useState(() => {
    return Math.max(1, parseInt(searchParams.get('page')) || 1);
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Debounce Search Input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch categories dynamically on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategoriesList(res.data || []);
      } catch (err) {
        console.error('Failed to load categories list', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch unique brands dynamically once
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await axios.get('/api/products?limit=1000');
        const brands = [...new Set((res.data.products || []).map((p) => p.brand))].filter(Boolean);
        setAllBrands(brands);
      } catch (err) {
        console.error('Failed to load brands list', err);
      }
    };
    fetchBrands();
  }, []);

  // Sync selected filters to browser URL search params
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    }
    if (selectedBrands.length > 0) {
      params.set('brands', selectedBrands.join(','));
    }
    if (priceRange.min > 0) {
      params.set('minPrice', priceRange.min);
    }
    if (priceRange.max < DEFAULT_MAX_PRICE) {
      params.set('maxPrice', priceRange.max);
    }
    if (selectedRating > 0) {
      params.set('rating', selectedRating);
    }
    if (inStockOnly) {
      params.set('stock', 'inStock');
    }
    if (discountOnly) {
      params.set('discount', 'true');
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (sortBy && sortBy !== 'best-selling') {
      params.set('sort', sortBy);
    }
    if (currentPage > 1) {
      params.set('page', currentPage);
    }

    setSearchParams(params, { replace: true });
  }, [
    selectedCategories,
    selectedBrands,
    priceRange,
    selectedRating,
    inStockOnly,
    discountOnly,
    searchQuery,
    sortBy,
    currentPage,
    setSearchParams,
  ]);

  // Dynamic products query handler triggered when filters change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        if (selectedCategories.length > 0) {
          params.append('categories', selectedCategories.join(','));
        }
        if (selectedBrands.length > 0) {
          params.append('brands', selectedBrands.join(','));
        }
        if (priceRange.min > 0) {
          params.append('minPrice', priceRange.min);
        }
        if (priceRange.max < DEFAULT_MAX_PRICE) {
          params.append('maxPrice', priceRange.max);
        }
        if (selectedRating > 0) {
          params.append('rating', selectedRating);
        }
        if (inStockOnly) {
          params.append('stock', 'inStock');
        }
        if (discountOnly) {
          params.append('discount', 'true');
        }
        if (sortBy) {
          params.append('sort', sortBy);
        }

        params.append('page', currentPage);
        params.append('limit', 6);

        const res = await axios.get(`/api/products?${params.toString()}`);
        setProductsList(res.data.products || []);
        setTotalPages(res.data.pages || 1);
        setTotalProducts(res.data.totalProducts || 0);
        setLoading(false);
      } catch (error) {
        console.error('Failed to query products from database', error);
        setLoading(false);
      }
    };

    setLoading(true);
    fetchFilteredProducts();
  }, [
    searchQuery,
    selectedCategories,
    selectedBrands,
    priceRange,
    selectedRating,
    inStockOnly,
    discountOnly,
    sortBy,
    currentPage,
  ]);

  // Reset pagination page when any filter changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [
    selectedCategories,
    selectedBrands,
    priceRange,
    selectedRating,
    inStockOnly,
    discountOnly,
    searchQuery,
    sortBy,
  ]);

  // Update document title dynamically
  useEffect(() => {
    if (selectedCategories.length === 1) {
      document.title = `${selectedCategories[0]} | ShopEZ`;
    } else if (selectedCategories.length > 1) {
      document.title = `${selectedCategories.length} Categories Selected | ShopEZ`;
    } else {
      document.title = 'All Products | ShopEZ';
    }
  }, [selectedCategories]);

  // Handlers for individual filter toggle
  const handleCategoryToggle = useCallback((catName) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  }, []);

  const handleBrandToggle = useCallback((brandName) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE });
    setSelectedRating(0);
    setInStockOnly(false);
    setDiscountOnly(false);
    setSearchInput('');
    setSearchQuery('');
    setSortBy('best-selling');
    setCurrentPage(1);
  }, []);

  // Calculate total number of active filter rules applied
  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += selectedCategories.length;
    count += selectedBrands.length;
    if (priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE) count += 1;
    if (selectedRating > 0) count += 1;
    if (inStockOnly) count += 1;
    if (discountOnly) count += 1;
    if (searchQuery.trim()) count += 1;
    return count;
  }, [
    selectedCategories,
    selectedBrands,
    priceRange,
    selectedRating,
    inStockOnly,
    discountOnly,
    searchQuery,
  ]);

  return (
    <div className="products-page-container">
      {/* Sidebar Filters */}
      <div className="products-sidebar-wrap">
        <FilterSidebar
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          selectedBrands={selectedBrands}
          onBrandToggle={handleBrandToggle}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          selectedRating={selectedRating}
          onRatingSelect={setSelectedRating}
          inStockOnly={inStockOnly}
          onStockToggle={() => setInStockOnly((prev) => !prev)}
          discountOnly={discountOnly}
          onDiscountToggle={() => setDiscountOnly((prev) => !prev)}
          onClearFilters={handleClearFilters}
          categoriesList={categoriesList}
          brandsList={allBrands}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Main Catalog View */}
      <div className="products-main-content">
        {/* Top Control Bar */}
        <div className="products-top-bar">
          <div className="top-search-wrap">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search products by name, brand, or category..."
            />
          </div>

          <div className="top-info-wrap">
            <span className="product-count">
              Showing <strong>{productsList.length}</strong> of{' '}
              <strong>{totalProducts}</strong> products
            </span>

            <div className="sort-select-wrapper">
              <label htmlFor="sort-by">Sort By:</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-dropdown"
              >
                <option value="best-selling">Best Selling</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="highest-rated">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Amazon/Flipkart/Myntra Filter Chips Bar */}
          {activeFilterCount > 0 && (
            <div className="filter-chips-bar">
              <div className="filter-chips-list">
                {selectedCategories.map((cat) => (
                  <span key={`cat-${cat}`} className="filter-chip">
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      aria-label={`Remove category ${cat}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}

                {selectedBrands.map((brand) => (
                  <span key={`brand-${brand}`} className="filter-chip">
                    {brand}
                    <button
                      type="button"
                      onClick={() => handleBrandToggle(brand)}
                      aria-label={`Remove brand ${brand}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}

                {(priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE) && (
                  <span className="filter-chip">
                    {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                    <button
                      type="button"
                      onClick={() => setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE })}
                      aria-label="Remove price filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {selectedRating > 0 && (
                  <span className="filter-chip">
                    {selectedRating}★ & Up
                    <button
                      type="button"
                      onClick={() => setSelectedRating(0)}
                      aria-label="Remove rating filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {inStockOnly && (
                  <span className="filter-chip">
                    In Stock Only
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      aria-label="Remove availability filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {discountOnly && (
                  <span className="filter-chip">
                    Discounted Only
                    <button
                      type="button"
                      onClick={() => setDiscountOnly(false)}
                      aria-label="Remove discount filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {searchQuery.trim() && (
                  <span className="filter-chip">
                    Search: "{searchQuery}"
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setSearchQuery('');
                      }}
                      aria-label="Clear search query"
                    >
                      ✕
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="clear-all-chips-btn"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="products-catalog-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : productsList.length > 0 ? (
          <div className="products-catalog-grid">
            {productsList.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-products-found">
            <div className="empty-state-icon">🛍️</div>
            <h3>No products found</h3>
            <p>
              We couldn't find any products matching your selected filters. Try removing some
              filters or broadening your search terms.
            </p>
            <button onClick={handleClearFilters} className="btn btn-primary clear-empty-btn">
              Clear All Filters
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default Products;
