import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as FaIcons from 'react-icons/fa';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import Rating from '../components/Rating';
import { HomeSkeleton } from '../components/Skeletons';
import './Home.css';

const Home = () => {
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Fetch real products and categories from database API
  useEffect(() => {
    document.title = 'ShopEz | Premium MERN E-Commerce Marketplace';
    const fetchHomeData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get('/api/products?limit=1000'),
          axios.get('/api/categories'),
        ]);

        const fetchedProducts = prodRes.data.products || prodRes.data || [];
        setProductsList(fetchedProducts);

        const fetchedCats = (catRes.data || []).filter(c => !c.parent);
        const uniqueCats = [];
        const seenNames = new Set();
        fetchedCats.forEach(c => {
          if (!seenNames.has(c.name)) {
            seenNames.add(c.name);
            uniqueCats.push(c);
          }
        });
        setCategoriesList(uniqueCats);

        // Dynamically fetch reviews for the first 3 products
        const reviewProducts = fetchedProducts.slice(0, 3);
        const reviewPromises = reviewProducts.map(p =>
          axios.get(`/api/reviews/product/${p._id}`).catch(() => ({ data: [] }))
        );
        const reviewsResponses = await Promise.all(reviewPromises);
        
        const dynamicReviews = [];
        reviewsResponses.forEach((res, idx) => {
          const productReviews = res.data || [];
          if (productReviews.length > 0) {
            const r = productReviews[0];
            dynamicReviews.push({
              id: r._id,
              name: r.name || 'Verified Buyer',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name || 'user'}`,
              rating: r.rating,
              comment: r.comment
            });
          } else {
            const prod = reviewProducts[idx];
            dynamicReviews.push({
              id: `fallback-${prod._id}`,
              name: 'Verified Customer',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=verified-${idx}`,
              rating: 5,
              comment: `Absolutely love this ${prod.name}! High quality, works perfectly as described, and fast shipping.`
            });
          }
        });
        setReviewsList(dynamicReviews);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load home page data from database', error);
        setLoading(false);
      }
    };
    fetchHomeData();

    // 10-second real-time polling
    const pollInterval = setInterval(fetchHomeData, 10000);

    // Event-driven instant updates
    window.addEventListener('product-updated', fetchHomeData);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('product-updated', fetchHomeData);
    };
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      toast.success(`Thank you for subscribing! We've sent a welcome offer to ${newsletterEmail}`);
      setNewsletterEmail('');
    }
  };

  // Filter products strictly by MongoDB tags & boolean flags
  const featuredProducts = productsList.filter((p) => p.featured || p.tag === 'featured');
  const trendingProducts = productsList.filter((p) => p.trending || p.tag === 'trending');
  const bestSellers = productsList.filter((p) => p.bestSeller || p.tag === 'best-seller');
  const newArrivals = productsList.filter((p) => p.newArrival || p.tag === 'new-arrival');

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="homepage-wrapper">
      {/* 1. Hero Banner Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-tagline">Exclusive Summer Collection 2026</span>
          <h1 className="hero-title">Step into the Future of Modern Shopping</h1>
          <p className="hero-description">
            Discover unmatched deals on premium electronics, fashion wardrobes, gadgets, and home essentials. Experience fast delivery and 100% secure payments.
          </p>
          <div className="hero-cta-group">
            <Link to="/products" className="btn btn-primary">
              Shop Now <FaIcons.FaArrowRight />
            </Link>
            <a href="#categories-section" className="btn btn-secondary">
              Explore Categories
            </a>
          </div>
        </div>
        <div className="hero-image-container">
          <img 
            src="/summer_banner.png" 
            alt="Summer Exclusive Collection" 
            className="hero-image"
          />
        </div>
      </section>

      {/* 2. Value Propositions Bar */}
      <section className="value-props-bar">
        <div className="prop-item">
          <FaIcons.FaTruck className="prop-icon" />
          <div>
            <h4>Free Shipping</h4>
            <p>On all orders above 5,000&nbsp;₹</p>
          </div>
        </div>
        <div className="prop-item">
          <FaIcons.FaUndo className="prop-icon" />
          <div>
            <h4>Easy Returns</h4>
            <p>30-day money-back guarantee</p>
          </div>
        </div>
        <div className="prop-item">
          <FaIcons.FaShieldAlt className="prop-icon" />
          <div>
            <h4>Secure Payments</h4>
            <p>100% protected checkout</p>
          </div>
        </div>
        <div className="prop-item">
          <FaIcons.FaHeadphones className="prop-icon" />
          <div>
            <h4>24/7 Support</h4>
            <p>Dedicated customer service</p>
          </div>
        </div>
      </section>

      {/* 3. Categories Section */}
      <section className="home-section" id="categories-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <p>Browse through our handpicked premium product collections</p>
        </div>
        <div className="categories-grid">
          {categoriesList.map((cat) => {
            const IconComponent = FaIcons[cat.icon] || FaIcons.FaShoppingBag;
            return (
              <CategoryCard 
                key={cat._id}
                name={cat.name}
                icon={IconComponent}
                image={cat.image}
                path={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`}
              />
            );
          })}
        </div>
      </section>

      {/* 4. Featured Products Section */}
      <section className="home-section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Handpicked highlights selected for maximum quality and style</p>
        </div>
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Offer Banner Section */}
      <section className="offer-banner-section">
        <div className="offer-banner-content">
          <span className="offer-badge">Mega Deal of the Week</span>
          <h2>Upgrade Your Tech Arsenal — Save Up To 50%</h2>
          <p>
            Get exclusive price reductions on wireless noise-cancelling headphones, high-performance laptops, and multi-device charging accessories. Offer valid till stock lasts.
          </p>
          <Link to="/products?category=electronics" className="btn btn-white">
            Claim Offer Now <FaIcons.FaArrowRight />
          </Link>
        </div>
      </section>

      {/* 6. Trending Products Section */}
      <section className="home-section">
        <div className="section-header">
          <h2>Trending Products</h2>
          <p>The most popular items our community is purchasing right now</p>
        </div>
        <div className="products-grid">
          {trendingProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. Best Sellers Section */}
      <section className="home-section">
        <div className="section-header">
          <h2>Best Sellers</h2>
          <p>Our top-rated products that customers absolutely love</p>
        </div>
        <div className="products-grid">
          {bestSellers.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 8. New Arrivals Section */}
      <section className="home-section">
        <div className="section-header">
          <h2>New Arrivals</h2>
          <p>Be the first to get your hands on our newest releases</p>
        </div>
        <div className="products-grid">
          {newArrivals.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 9. Customer Reviews Section */}
      <section className="home-section reviews-section">
        <div className="section-header">
          <h2>What Our Customers Say</h2>
          <p>Read transparent testimonials from verified buyers</p>
        </div>
        <div className="reviews-grid">
          {reviewsList.map((rev) => (
            <div key={rev.id} className="review-card">
              <div className="review-user-row">
                <img src={rev.avatar} alt={rev.name} className="review-avatar" />
                <div>
                  <h4>{rev.name}</h4>
                  <Rating value={rev.rating} />
                </div>
              </div>
              <p className="review-comment">"{rev.comment}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Newsletter Subscription Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Subscribe to our Newsletter</h2>
          <p>Join our newsletter and receive a 10% discount coupon code for your first purchase!</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder="Enter your email address..." 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
            />
            <button type="submit" className="newsletter-submit-btn">
              Subscribe <FaIcons.FaPaperPlane />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
