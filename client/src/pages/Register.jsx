import React, { useState, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const { register: registerUserApi, user } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If user already logged in, redirect away
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await registerUserApi(data.name, data.email, data.password);
      navigate('/');
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Register to unlock premium discounts, custom lists, and cart tracking</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Name Group */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-icon-wrapper">
              <FaUser className="input-icon" />
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
              />
            </div>
            {errors.name && <span className="input-error-msg">{errors.name.message}</span>}
          </div>

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
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="Create password"
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

          {/* Confirm Password Group */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === passwordVal || 'Passwords do not match',
                })}
              />
            </div>
            {errors.confirmPassword && (
              <span className="input-error-msg">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit Action */}
          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : (
              <>
                Register <FaUserPlus />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? </span>
          <Link to="/login">Login Here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
