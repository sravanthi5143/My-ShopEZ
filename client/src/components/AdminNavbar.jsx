import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaSun,
  FaMoon,
  FaBell,
  FaTimes,
  FaCheckDouble,
  FaExclamationTriangle,
  FaShoppingBag,
  FaUserPlus,
  FaTimesCircle,
  FaBars
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import './AdminNavbar.css';

const AdminNavbar = ({ toggleSidebar }) => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { socket } = useSocket();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/admin/notifications', config);
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load navbar notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Socket.IO Real-time synchronization
    if (socket) {
      socket.on('new-admin-notification', (newNotif) => {
        // Prepend new notification to state
        setNotifications((prev) => [newNotif, ...prev]);
        // Open the drawer automatically for high-priority alerts
        if (newNotif.type === 'danger' || newNotif.type === 'success') {
          setNotificationsOpen(true);
        }
      });
      
      socket.on('admin-notifications-read-all', () => fetchNotifications());
      socket.on('admin-notification-read', () => fetchNotifications());
      socket.on('admin-notification-deleted', () => fetchNotifications());
    }
    
    return () => {
      if (socket) {
        socket.off('new-admin-notification');
        socket.off('admin-notifications-read-all');
        socket.off('admin-notification-read');
        socket.off('admin-notification-deleted');
      }
    };
  }, [user, socket]);

  // Resolve corresponding icon based on notification parameters
  const getNotificationIcon = (type, title) => {
    const titleLower = title?.toLowerCase() || '';
    if (titleLower.includes('stock') || type === 'warning') return FaExclamationTriangle;
    if (titleLower.includes('customer') || titleLower.includes('signup')) return FaUserPlus;
    if (titleLower.includes('cancelled') || type === 'danger') return FaTimesCircle;
    if (titleLower.includes('pending') || type === 'info') return FaClock;
    return FaShoppingBag;
  };

  const handleClearAll = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put('/api/admin/notifications/read-all', {}, config);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveNotification = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/admin/notifications/${id}`, config);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/admin/notifications/${id}/read`, {}, config);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="admin-navbar">
      <div className="topbar-welcome" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="navbar-icon-action-btn mobile-hamburger-toggle" 
          onClick={toggleSidebar} 
          aria-label="Toggle Sidebar"
          style={{ display: 'none' }} // Hidden on desktop via CSS, shown on mobile
        >
          <FaBars />
        </button>
        <div>
          <h1>Welcome back, Administrator</h1>
          <div className="datetime-badge">
            <FaCalendarAlt />
            <span>{currentTime.toLocaleDateString()}</span>
            <FaClock />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="topbar-actions-row">
        {/* Global search */}
        <div className="navbar-search-wrapper">
          <FaSearch />
          <input
            type="text"
            placeholder="Global search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dark Mode toggle */}
        <button className="navbar-icon-action-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>

        {/* Dynamic notifications bell */}
        <div className="notification-bell-container">
          <button className="navbar-icon-action-btn bell-btn" onClick={() => setNotificationsOpen(!notificationsOpen)} title="Notifications">
            <FaBell />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bell-badge">{notifications.filter(n => !n.isRead).length}</span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h4>Notifications ({notifications.filter(n => !n.isRead).length})</h4>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={handleClearAll} className="clear-all-alerts-btn">Mark All Read</button>
                )}
              </div>
              <div className="dropdown-body scrollbar-styled">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const Icon = getNotificationIcon(n.type, n.title);
                    return (
                      <div key={n._id} className={`dropdown-alert-row ${n.type} ${!n.isRead ? 'unread' : 'read'}`} style={{ opacity: n.isRead ? 0.6 : 1 }}>
                        <Icon className="alert-row-icon" />
                        <div className="alert-row-text" onClick={() => !n.isRead && handleMarkAsRead(n._id)} style={{ cursor: 'pointer' }}>
                          <h5>{n.title}</h5>
                          <p>{n.message || n.text}</p>
                        </div>
                        <button className="remove-alert-btn" onClick={() => handleRemoveNotification(n._id)}>
                          <FaTimes />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-alerts-box">
                    <FaCheckDouble className="no-alerts-icon" />
                    <p>No new alerts.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User initials tag */}
        {user && (
          <div className="topbar-profile">
            <div className="avatar-letter">{user.name.charAt(0).toUpperCase()}</div>
            <div className="profile-details-text">
              <span className="name">{user.name}</span>
              <span className="role-lbl">Admin</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminNavbar;
