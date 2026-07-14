import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to fetch authorization config headers
  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    };
  };

  // 1. Fetch Wishlist from MongoDB
  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/wishlist', getAuthConfig());
      setWishlistItems(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
      setLoading(false);
    }
  };

  // Sync wishlist automatically when user logs in/out
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  // 2. Add product to wishlist
  const addToWishlist = async (productId) => {
    if (!user) {
      toast.warning('Please login to save products to your wishlist.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/wishlist',
        { productId },
        getAuthConfig()
      );
      setWishlistItems(response.data.products || []);
      toast.success('Added to wishlist');
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Failed to add product to wishlist', error);
      setLoading(false);
      throw error.response?.data?.message || 'Failed to add to wishlist';
    }
  };

  // 3. Remove product from wishlist
  const removeFromWishlist = async (productId) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/wishlist/${productId}`,
        getAuthConfig()
      );
      setWishlistItems(response.data.products || []);
      toast.info('Removed from wishlist');
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Failed to remove product from wishlist', error);
      setLoading(false);
      throw error.response?.data?.message || 'Failed to remove from wishlist';
    }
  };

  // 4. Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item._id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
