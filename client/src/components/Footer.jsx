import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaGithub, 
  FaEnvelope, 
  FaPhoneAlt, 
  FaMapMarkerAlt 
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Column 1: About Brand */}
            <div className="footer-col about-col">
              <img src="/logo.jpg" alt="SHOPEZ Logo" style={{ height: '44px', marginBottom: '12px', borderRadius: '4px' }} />
              <p>
                Your ultimate destination for modern, premium shopping. Experience high quality electronics, fashion, and lifestyle accessories delivered directly to your doorstep.
              </p>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
              </div>
            </div>

            {/* Column 2: Categories */}
            <div className="footer-col">
              <h4>Shop Categories</h4>
              <ul>
                <li><Link to="/products?category=electronics">Electronics</Link></li>
                <li><Link to="/products?category=mobiles">Mobiles</Link></li>
                <li><Link to="/products?category=laptops">Laptops</Link></li>
                <li><Link to="/products?category=footwear">Footwear</Link></li>
              </ul>
            </div>

            {/* Column 3: Quick Links */}
            <div className="footer-col">
              <h4>Customer Service</h4>
              <ul>
                <li><Link to="/profile">My Account</Link></li>
                <li><Link to="/my-orders">Track Orders</Link></li>
                <li><Link to="/wishlist">Wishlist</Link></li>
                <li><Link to="/cart">Shopping Cart</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div className="footer-col contact-col">
              <h4>Contact Us</h4>
              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <span>123 Commerce Way, Tech City, USA</span>
              </div>
              <div className="contact-item">
                <FaPhoneAlt className="contact-icon" />
                <span>+1 (800) 123-4567</span>
              </div>
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <span>support@shopez.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Legal Copyright */}
      <div className="footer-bottom">
        <div className="footer-container bottom-flex">
          <p>&copy; {new Date().getFullYear()} ShopEZ. All rights reserved.</p>
          <div className="bottom-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
