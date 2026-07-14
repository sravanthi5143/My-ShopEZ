import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Loader from './Loader';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Trigger toast notification if unauthorized customer tries to access admin routes
  useEffect(() => {
    if (!loading && user && adminOnly && user.role !== 'admin') {
      toast.error('You do not have permission to access this page.');
    }
  }, [user, loading, adminOnly]);

  // Show generic loader until auth context finishes verification
  if (loading) {
    return <Loader />;
  }

  // If not logged in, redirect to login page and preserve origin path in router state
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If page requires administrator privileges but current user is not admin, redirect to home page
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
