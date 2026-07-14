import React, { useState, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaExclamationTriangle, FaShoppingBag, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, logout, updateLocalUser } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    return <div>Loading...</div>;
  }
  
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'My Account | ShopEz';
  }, []);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm();

  const onProfileUpdate = (data) => {
    setProfileMsg({ text: '', type: '' });
    setLoading(true);
    
    // Simulate API profile update delay
    setTimeout(() => {
      updateLocalUser({ name: data.name, email: data.email });
      setProfileMsg({ text: 'Profile details updated successfully!', type: 'success' });
      setLoading(false);
    }, 800);
  };

  const onPasswordUpdate = (data) => {
    setPasswordMsg({ text: '', type: '' });
    setLoading(true);

    // Simulate API password change delay
    setTimeout(() => {
      setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
      resetPasswordForm();
      setLoading(false);
    }, 800);
  };

  const confirmNewPasswordVal = watchPassword('newPassword');

  const getMemberSinceDate = (id) => {
    if (!id || id.length !== 24) return 'July 2026';
    try {
      const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'July 2026';
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-sidebar-card">
        <div className="avatar-placeholder">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h3>{user.name}</h3>
        <span className={`profile-role-badge ${user.role === 'admin' ? 'admin' : 'customer'}`}>
          {user.role === 'admin' ? '🔴 Administrator' : '🟢 Customer'}
        </span>
        <p className="profile-email-lbl">{user.email}</p>
        
        <hr className="profile-sidebar-divider" />
        
        <div className="profile-meta-details" style={{ 
          textAlign: 'left', 
          width: '100%',
          fontSize: '0.85rem', 
          color: 'var(--text-light)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          marginBottom: '15px' 
        }}>
          <div>
            <strong>Account Type:</strong> {user.role === 'admin' ? 'Administrator' : 'Customer Account'}
          </div>
          <div>
            <strong>Member Since:</strong> {getMemberSinceDate(user._id)}
          </div>
        </div>
        
        <div className="sidebar-links-group">
          <Link to="/my-orders" className="sidebar-link">
            <FaShoppingBag /> My Orders
          </Link>
          <button onClick={() => { logout(); navigate('/login'); }} className="sidebar-logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      <div className="profile-forms-section">
        {/* Profile Settings form */}
        <div className="profile-form-card">
          <h3>Account Information</h3>
          {profileMsg.text && (
            <div className={`auth-alert ${profileMsg.type}`}>
              {profileMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />} {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="profile-form">
            <div className="form-group">
              <label htmlFor="profileName">Full Name</label>
              <div className="input-icon-wrapper">
                <FaUser className="input-icon" />
                <input
                  id="profileName"
                  type="text"
                  {...registerProfile('name', { required: 'Name is required' })}
                />
              </div>
              {profileErrors.name && <span className="input-error-msg">{profileErrors.name.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="profileEmail">Email Address</label>
              <div className="input-icon-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  id="profileEmail"
                  type="email"
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </div>
              {profileErrors.email && <span className="input-error-msg">{profileErrors.email.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary profile-submit-btn" disabled={loading}>
              Update Profile
            </button>
          </form>
        </div>

        {/* Change Password form */}
        <div className="profile-form-card">
          <h3>Change Password</h3>
          {passwordMsg.text && (
            <div className={`auth-alert ${passwordMsg.type}`}>
              {passwordMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />} {passwordMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit(onPasswordUpdate)} className="profile-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="input-icon-wrapper">
                <FaLock className="input-icon" />
                <input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                />
              </div>
              {passwordErrors.currentPassword && (
                <span className="input-error-msg">{passwordErrors.currentPassword.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-icon-wrapper">
                <FaLock className="input-icon" />
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
              </div>
              {passwordErrors.newPassword && (
                <span className="input-error-msg">{passwordErrors.newPassword.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <div className="input-icon-wrapper">
                <FaLock className="input-icon" />
                <input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  {...registerPassword('confirmNewPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === confirmNewPasswordVal || 'Passwords do not match',
                  })}
                />
              </div>
              {passwordErrors.confirmNewPassword && (
                <span className="input-error-msg">{passwordErrors.confirmNewPassword.message}</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary profile-submit-btn" disabled={loading}>
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
