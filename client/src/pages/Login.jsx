import React, { useState, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path if user was intercepted trying to access protected paths
  const from = (() => {
    const stateVal = location.state?.from;
    if (stateVal) {
      if (typeof stateVal === 'string') return stateVal;
      if (typeof stateVal === 'object' && stateVal.pathname) return stateVal.pathname;
    }
    return '/';
  })();

  // If user already logged in, redirect away
  useEffect(() => {
    if (user) {
      console.log('[DEBUG-FRONTEND] Logged-in user found on mount. Role:', user.role);
      if (user.role === 'admin') {
        console.log('[DEBUG-FRONTEND] Admin user on mount. Redirecting to /admin/dashboard');
        navigate('/admin/dashboard', { replace: true });
      } else {
        console.log('[DEBUG-FRONTEND] Customer user on mount. Redirecting to:', from);
        if (from.startsWith('/admin')) {
          navigate('/', { replace: true });
        } else {
          navigate(from, { state: { buyNowItem: location.state?.buyNowItem }, replace: true });
        }
      }
    }
  }, [user, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    console.log('[DEBUG-FRONTEND] Request sent. Login attempt for:', data.email);
    try {
      const loggedUser = await login(data.email, data.password);
      console.log('[DEBUG-FRONTEND] Frontend received response successfully. User:', loggedUser);
      if (loggedUser.role === 'admin') {
        console.log('[DEBUG-FRONTEND] Successful admin authentication. Redirecting to dashboard...');
        navigate('/admin/dashboard', { replace: true });
      } else {
        console.log('[DEBUG-FRONTEND] Successful customer authentication. Redirecting to target path:', from);
        if (from.startsWith('/admin')) {
          navigate('/', { replace: true });
        } else {
          navigate(from, { state: { buyNowItem: location.state?.buyNowItem }, replace: true });
        }
      }
      console.log('[DEBUG-FRONTEND] Navigation completed.');
    } catch (err) {
      console.error('[DEBUG-FRONTEND] Authentication failed:', err);
      const errorMsg = err || 'Failed to connect to authentication server';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      console.log('[DEBUG-FRONTEND] Resetting loading state.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to manage your orders, wishlist, and cart</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Email Group */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-icon-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="example@domain.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>
            {errors.email && <span className="input-error-msg">{errors.email.message}</span>}
          </div>

          {/* Password Group */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-pass-link">
                Forgot Password?
              </Link>
            </div>
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
            </div>
            {errors.password && <span className="input-error-msg">{errors.password.message}</span>}
          </div>

          {/* Submit Action */}
          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Logging In...' : (
              <>
                Login <FaSignInAlt />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>New to ShopEZ? </span>
          <Link to="/register">Create an Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
