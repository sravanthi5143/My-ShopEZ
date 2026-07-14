import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaShoppingCart, 
  FaBolt, 
  FaHeart, 
  FaPlus, 
  FaMinus, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowLeft,
  FaStar,
  FaEdit,
  FaTrashAlt,
  FaRegStar
} from 'react-icons/fa';
import Rating from '../components/Rating';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/priceFormatter';
import Price from '../components/Price';
import { ProductDetailsSkeleton } from '../components/Skeletons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. Context Triggers
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);

  // 2. Local States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productsList, setProductsList] = useState([]); // Loaded for related/bundle components fallback

  const isWishlisted = isInWishlist(id);

  // 3. Reviews States
  const [productReviews, setProductReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Fetch product detail and catalog fallback records
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const prodRes = await axios.get(`/api/products/${id}`);
        setProduct(prodRes.data);
        setActiveImage(prodRes.data.image);
        document.title = `${prodRes.data.name} | ShopEz`;
        
        // Fetch related products matching product category from MongoDB
        const catalogRes = await axios.get(`/api/products?category=${encodeURIComponent(prodRes.data.category)}`);
        setProductsList(catalogRes.data.products || catalogRes.data || []);

        // Load reviews from MongoDB database
        const reviewsRes = await axios.get(`/api/reviews/product/${id}`);
        setProductReviews(reviewsRes.data || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load product details', error);
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id, user]);

  const handleQtyChange = (type) => {
    if (!product) return;
    if (type === 'inc' && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    } else if (type === 'dec' && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Image gallery builder
  const galleryImages = useMemo(() => {
    if (!product) return [];
    return [
      product.image,
      "/placeholder.png",
      "/placeholder.png",
    ];
  }, [product]);

  // Specs listing builder
  const specs = useMemo(() => {
    if (!product) return {};
    return {
      'Brand': product.brand,
      'Category': product.category,
      'Model Number': `EZ-${id.toUpperCase().slice(-6)}`,
      'Warranty': '1 Year Manufacturer Warranty',
      'Weight': '240 grams',
      'Box Contents': 'Main product, User Guide, Warranty Card, Charging Cable'
    };
  }, [product, id]);

  // Frequently Bought Together Bundle computations
  const bundleProduct = useMemo(() => {
    if (productsList.length === 0 || !product) return null;
    return productsList.find((p) => p._id !== id) || productsList[1];
  }, [productsList, id, product]);

  const bundlePrice = useMemo(() => {
    if (!product || !bundleProduct) return 0;
    const p1 = product.discountPrice || product.price;
    const p2 = bundleProduct.discountPrice || bundleProduct.price;
    return (p1 + p2) * 0.9; // 10% bundle discount
  }, [product, bundleProduct]);

  // Related products filters
  const relatedProducts = useMemo(() => {
    if (productsList.length === 0 || !product) return [];
    return productsList
      .filter((p) => p.category === product.category && p._id !== id)
      .slice(0, 4);
  }, [productsList, product, id]);

  // Dynamic reviews metrics (Average and distribution percentage breakdown)
  const reviewsStats = useMemo(() => {
    const total = productReviews.length;
    if (total === 0) {
      return { average: 0, total: 0, percentages: [0, 0, 0, 0, 0] };
    }

    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Number((sum / total).toFixed(1));

    const distribution = [0, 0, 0, 0, 0]; // 1 star to 5 stars
    productReviews.forEach((r) => {
      const idx = Math.min(Math.max(1, r.rating), 5) - 1;
      distribution[idx]++;
    });

    const percentages = distribution.map((c) => Math.round((c / total) * 100)).reverse(); // [5 star %, 4 star %, ...]
    return { average, total, percentages };
  }, [productReviews]);

  // Real Database Cart Integration triggers
  const handleAddToCartClick = async () => {
    if (!product) return;
    try {
      const res = await addToCart(product._id, quantity);
      if (!res) return;
      toast.success(`Added ${quantity}x "${product.name}" to cart!`);
    } catch (err) {
      toast.error(err || 'Failed to add item');
    }
  };

  const handleBuyNowClick = () => {
    if (!product) return;
    if (!user) {
      toast.warning('Please login first to proceed with your order.');
      navigate('/login', { state: { from: '/checkout', buyNowItem: { product, quantity } } });
      return;
    }
    navigate('/checkout', { state: { buyNowItem: { product, quantity } } });
  };

  const handleWishlistClick = async () => {
    if (!user) {
      toast.warning('Please login to save products to your wishlist.');
      return;
    }
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } catch (err) {
      toast.error(err || 'Failed to update wishlist');
    }
  };

  const handleAddBundleToCartClick = async () => {
    if (!product || !bundleProduct) return;
    try {
      const res1 = await addToCart(product._id, 1);
      if (!res1) return;
      const res2 = await addToCart(bundleProduct._id, 1);
      if (!res2) return;
      toast.success(`Added Bundle ("${product.name}" + "${bundleProduct.name}") to your cart at a discounted rate!`);
      navigate('/cart');
    } catch (err) {
      toast.error(err || 'Failed to add bundle');
    }
  };

  // 4. WRITE REVIEW HANDLER
  const handleWriteReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Please login to write a review.');
      return;
    }
    if (!newComment.trim()) {
      toast.warning('Please enter a review comment.');
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${user.token}` },
    };

    try {
      const res = await axios.post(
        '/api/reviews',
        { productId: product._id, rating: newRating, comment: newComment },
        config
      );
      setProductReviews((prev) => [res.data, ...prev]);
      setNewComment('');
      setNewRating(5);
      toast.success('Thank you! Your review has been published.');

      // Reload product to sync average rating and count
      const prodRes = await axios.get(`/api/products/${id}`);
      setProduct(prodRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  // 5. EDIT REVIEW HANDLERS
  const startEditingReview = (rev) => {
    setEditingReviewId(rev._id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  const handleEditReviewSubmit = async (e) => {
    e.preventDefault();
    if (!editComment.trim()) {
      toast.warning('Review comment cannot be empty.');
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${user.token}` },
    };

    try {
      const res = await axios.put(
        `/api/reviews/${editingReviewId}`,
        { rating: editRating, comment: editComment },
        config
      );
      setProductReviews((prev) =>
        prev.map((r) => (r._id === editingReviewId ? res.data : r))
      );
      setEditingReviewId(null);
      toast.success('Your review has been updated successfully!');

      // Reload product to sync average rating and count
      const prodRes = await axios.get(`/api/products/${id}`);
      setProduct(prodRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update review.');
    }
  };

  // 6. DELETE REVIEW HANDLER
  const handleDeleteReview = async (revId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      try {
        await axios.delete(`/api/reviews/${revId}`, config);
        setProductReviews((prev) => prev.filter((r) => r._id !== revId));
        toast.info('Your review has been removed.');

        // Reload product to sync average rating and count
        const prodRes = await axios.get(`/api/products/${id}`);
        setProduct(prodRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete review.');
      }
    }
  };

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <Link to="/products" className="back-link-btn">
          <FaArrowLeft /> Back to Catalog
        </Link>
        <div className="no-products-found">
          <h3>Product Not Found</h3>
          <p>The product identifier may be invalid or was removed from inventory.</p>
        </div>
      </div>
    );
  }

  const { name, brand, category, price, discountPrice, numReviews, stock } = product;
  const activePrice = discountPrice || price;
  const discountPercentage = price > discountPrice 
    ? Math.round(((price - discountPrice) / price) * 100)
    : null;

  return (
    <div className="product-details-page">
      <Link to="/products" className="back-link-btn">
        <FaArrowLeft /> Back to Catalog
      </Link>

      <div className="product-details-grid">
        {/* Left Section: Gallery */}
        <div className="gallery-section">
          <div className="main-image-container">
            <img 
              src={activeImage || '/placeholder.png'} 
              alt={name} 
              className="main-image" 
              onError={(e) => { e.target.src = '/placeholder.png'; }}
            />
            {discountPercentage && (
              <span className="details-discount-badge">-{discountPercentage}%</span>
            )}
          </div>
        </div>

        {/* Right Section: Details Panel */}
        <div className="details-panel-section">
          <span className="details-brand">{brand}</span>
          <h1 className="details-title">{name}</h1>
          
          <div className="details-rating-row">
            <Rating value={reviewsStats.average} text={`${reviewsStats.average} Stars`} />
            <span className="reviews-count-badge">{reviewsStats.total} Reviews</span>
          </div>

          <hr className="details-divider" />

          {/* Pricing Row */}
          <div className="details-price-row">
            <Price price={price} discountPrice={discountPrice} size="lg" />
          </div>

          {/* Stock Availability */}
          <div className="details-stock-row">
            <span>Availability:</span>
            {stock > 0 ? (
              <span className="stock-status in-stock">
                <FaCheckCircle /> In Stock ({stock} available)
              </span>
            ) : (
              <span className="stock-status out-of-stock">
                <FaTimesCircle /> Out of Stock
              </span>
            )}
          </div>

          {/* Product Description */}
          <div className="details-description">
            <p>
              Experience next-level luxury and comfort with this premium, high-quality {category.toLowerCase()} item from {brand}. Designed for durability, style, and optimum performance, it features standard-setting craftsmanship that exceeds expectations.
            </p>
          </div>

          {/* Quantity Selector & Price Update */}
          {stock > 0 && (
            <div className="details-quantity-section">
              <span>Quantity:</span>
              <div className="qty-picker">
                <button onClick={() => handleQtyChange('dec')} disabled={quantity <= 1}>
                  <FaMinus />
                </button>
                <input type="text" value={quantity} readOnly />
                <button onClick={() => handleQtyChange('inc')} disabled={quantity >= stock}>
                  <FaPlus />
                </button>
              </div>
              <span className="dynamic-subtotal-price" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Subtotal: <Price price={activePrice * quantity} size="sm" />
              </span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="details-actions-row">
            <button 
              className="btn btn-primary cta-btn" 
              onClick={handleAddToCartClick}
              disabled={stock === 0}
            >
              <FaShoppingCart /> Add to Cart
            </button>
            <button 
              className="btn btn-orange cta-btn" 
              onClick={handleBuyNowClick}
              disabled={stock === 0}
            >
              <FaBolt /> Buy Now
            </button>
            <button 
              className={`btn btn-secondary wishlist-btn ${isWishlisted ? 'active' : ''}`}
              onClick={handleWishlistClick}
            >
              <FaHeart className={isWishlisted ? 'wishlist-active-icon' : ''} /> 
              {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <section className="details-extra-section">
        <h3>Product Specifications</h3>
        <div className="specs-table-container">
          <table className="specs-table">
            <tbody>
              {Object.entries(specs).map(([key, val]) => (
                <tr key={key}>
                  <td className="spec-label">{key}</td>
                  <td className="spec-value">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Bought Together */}
      {bundleProduct && (
        <section className="details-extra-section bundle-section">
          <h3>Frequently Bought Together</h3>
          <div className="bundle-container">
            <div className="bundle-items-flex">
              <div className="bundle-item-card">
                <img 
                  src={product.image || '/placeholder.png'} 
                  alt={name} 
                  onError={(e) => { e.target.src = '/placeholder.png'; }}
                />
                <h5>{name}</h5>
                <Price price={price} discountPrice={discountPrice} size="sm" />
              </div>

              <FaPlus className="bundle-plus-icon" />

              <div className="bundle-item-card">
                <img 
                  src={bundleProduct.image || '/placeholder.png'} 
                  alt={bundleProduct.name} 
                  onError={(e) => { e.target.src = '/placeholder.png'; }}
                />
                <h5>{bundleProduct.name}</h5>
                <Price price={bundleProduct.price} discountPrice={bundleProduct.discountPrice} size="sm" />
              </div>
            </div>

            <div className="bundle-checkout-card">
              <div className="bundle-price-info">
                <span>Total Bundle Price:</span>
                <Price price={bundlePrice} size="md" />
                <span className="bundle-save-badge">Save 10% Bundle Discount!</span>
              </div>
              <div className="bundle-checkout-card-footer">
                <button className="btn btn-primary" onClick={handleAddBundleToCartClick}>
                  Add Bundle to Cart
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CUSTOMER REVIEWS & RATINGS BREAKDOWN SECTION */}
      <section className="details-extra-section customer-reviews-section">
        <h3>Customer Reviews</h3>
        
        <div className="reviews-layout-grid">
          {/* Left Summary & Distribution Column */}
          <div className="reviews-summary-column">
            <div className="avg-rating-box">
              <h2 className="avg-rating-value">{reviewsStats.average}</h2>
              <Rating value={reviewsStats.average} />
              <span className="avg-rating-sub">Based on {reviewsStats.total} reviews</span>
            </div>

            {/* Rating distribution progress bars */}
            <div className="rating-distribution-list">
              {reviewsStats.percentages.map((percentage, index) => {
                const starVal = 5 - index;
                return (
                  <div key={starVal} className="distribution-row">
                    <span className="dist-stars">{starVal} ★</span>
                    <div className="dist-progress-bar">
                      <div className="dist-progress-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="dist-percentage">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Writing & List Column */}
          <div className="reviews-feedback-column">
            {/* 1. Add Review Form */}
            {user ? (
              <div className="write-review-form-box">
                <h4>Write a Review</h4>
                <form onSubmit={handleWriteReviewSubmit} className="feedback-form">
                  <div className="form-group">
                    <label>Rating:</label>
                    <div className="stars-selector-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          className="star-select-btn"
                          onClick={() => setNewRating(star)}
                        >
                          {star <= newRating ? (
                            <FaStar className="star-select-icon active" />
                          ) : (
                            <FaRegStar className="star-select-icon" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reviewComment">Comment:</label>
                    <textarea
                      id="reviewComment"
                      placeholder="Share your experience with this product..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary btn-sm">
                    Submit Review
                  </button>
                </form>
              </div>
            ) : (
              <div className="login-to-review-box">
                <p>Please <Link to="/login">login</Link> to write a review for this product.</p>
              </div>
            )}

            {/* 2. Reviews List */}
            <div className="reviews-listing-box">
              <h4>Product Reviews</h4>
              <div className="reviews-feed">
                {productReviews.length > 0 ? (
                  productReviews.map((rev) => {
                    const isUserOwned = user && rev.user === user._id;
                    const revDate = new Date(rev.createdAt).toLocaleDateString();

                    return (
                      <div key={rev._id} className="feed-review-card">
                        <div className="feed-review-header">
                          <div className="feed-avatar">
                            {rev.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="feed-meta">
                            <h5>{rev.name}</h5>
                            <span className="feed-date">{revDate}</span>
                          </div>
                          
                          {/* Stars */}
                          <div className="feed-stars-row">
                            <Rating value={rev.rating} />
                          </div>

                          {/* Owner controls */}
                          {isUserOwned && editingReviewId !== rev._id && (
                            <div className="feed-owner-controls">
                              <button onClick={() => startEditingReview(rev)} title="Edit Review">
                                <FaEdit />
                              </button>
                              <button onClick={() => handleDeleteReview(rev._id)} title="Delete Review">
                                <FaTrashAlt />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Comment or Editing Form */}
                        {editingReviewId === rev._id ? (
                          <form onSubmit={handleEditReviewSubmit} className="inline-edit-form">
                            <div className="form-group">
                              <label>Rating:</label>
                              <div className="stars-selector-row">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    type="button"
                                    key={star}
                                    className="star-select-btn"
                                    onClick={() => setEditRating(star)}
                                  >
                                    {star <= editRating ? (
                                      <FaStar className="star-select-icon active" />
                                    ) : (
                                      <FaRegStar className="star-select-icon" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="form-group">
                              <textarea
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                rows={2}
                                required
                              ></textarea>
                            </div>
                            <div className="inline-actions-row">
                              <button type="submit" className="btn btn-primary btn-sm">Save</button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingReviewId(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <p className="feed-comment">"{rev.comment}"</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="no-reviews-note">No reviews have been written for this product yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="details-extra-section">
          <h3>Related Products</h3>
          <div className="related-products-grid">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
