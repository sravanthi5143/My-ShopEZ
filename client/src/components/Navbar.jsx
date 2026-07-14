import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaShoppingBag, 
  FaSearch, 
  FaHeart, 
  FaShoppingCart, 
  FaUser, 
  FaBars, 
  FaTimes, 
  FaChevronDown,
  FaSignOutAlt,
  FaChartLine,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // 1. Context Triggers
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Fetch categories dynamically on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        const parents = (res.data || []).filter(c => !c.parent);
        setCategories(parents);
      } catch (err) {
        console.error('Navbar categories load error:', err);
      }
    };
    fetchCategories();
  }, []);

  // Compute total items quantity in cart dynamically
  const cartCount = cartItems
    .filter(item => item && item.product && item.product._id)
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    setProfileOpen(false);
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <img src="/logo.jpg" alt="SHOPEZ Logo" className="navbar-logo-img" />
        </Link>

        {/* Center: Search Bar */}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search products, brands, and categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <FaSearch />
          </button>
        </form>

        {/* Mobile menu toggle button */}
        <button className="mobile-menu-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation Links & Action Icons */}
        <div className={`navbar-nav-group ${isOpen ? 'active' : ''}`}>
          {/* Main Navigation Links */}
          <ul className="navbar-menu">
            <li>
              <Link to="/" className="menu-link" onClick={() => setIsOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/products" className="menu-link" onClick={() => setIsOpen(false)}>
                Products
              </Link>
            </li>
            <li className="nav-dropdown-wrapper">
              <span className="menu-link dropdown-trigger">
                Categories <FaChevronDown className="arrow-icon" />
              </span>
              <ul className="dropdown-menu">
                {categories.slice(0, 6).map((cat) => (
                  <li key={cat._id || cat.name}>
                    <Link to={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`} onClick={() => setIsOpen(false)}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          {/* Right Action Icons */}
          <div className="navbar-actions">
            <button 
              className="action-btn theme-toggle-btn" 
              onClick={toggleTheme} 
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <div className="icon-wrapper">
                {theme === 'light' ? <FaMoon className="action-icon" /> : <FaSun className="action-icon theme-sun-icon" />}
              </div>
              <span className="action-text">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            <Link to="/wishlist" className="action-btn" title="Wishlist" onClick={() => setIsOpen(false)}>
              <div className="icon-wrapper">
                <FaHeart className="action-icon wishlist-icon" />
              </div>
              <span className="action-text">Wishlist</span>
            </Link>

            <Link to="/cart" className="action-btn cart-btn" title="Cart" onClick={() => setIsOpen(false)}>
              <div className="icon-wrapper">
                <FaShoppingCart className="action-icon" />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
              <span className="action-text">Cart</span>
            </Link>

            {user ? (
              <div className="profile-menu-container">
                <button 
                  className="action-btn profile-trigger" 
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <FaUser className="action-icon" />
                  <span className="action-text">{user.name}</span>
                  <FaChevronDown className="arrow-icon" />
                </button>
                {profileOpen && (
                  <ul className="profile-dropdown">
                    <div className="profile-dropdown-user-info">
                      <span className="user-name">👤 {user.name}</span>
                      <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'customer'}`}>
                        {user.role === 'admin' ? '🔴 Administrator' : '🟢 Customer'}
                      </span>
                    </div>
                    <hr className="profile-dropdown-divider" />
                    <li>
                      <Link to="/profile" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <Link to="/my-orders" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
                        My Orders
                      </Link>
                    </li>
                    {user.role === 'admin' && (
                      <li>
                        <Link to="/admin/dashboard" onClick={() => { setProfileOpen(false); setIsOpen(false); }}>
                          <FaChartLine /> Admin Dashboard
                        </Link>
                      </li>
                    )}
                    <li>
                      <button onClick={handleLogoutClick}>
                        <FaSignOutAlt /> Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-link-btn" onClick={() => setIsOpen(false)}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
