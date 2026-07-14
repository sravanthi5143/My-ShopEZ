import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to fetch authorization config headers
  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    };
  };

  // 1. Fetch Cart from Backend
  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/cart', getAuthConfig());
      setCartItems(response.data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch cart', error);
      setLoading(false);
    }
  };

  // Sync cart automatically when user state changes
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  // 2. Add Item to Cart
  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.warning('Please login to add products to your cart.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/cart',
        { productId, quantity },
        getAuthConfig()
      );
      setCartItems(response.data.items || []);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Failed to add item to cart', error);
      setLoading(false);
      throw error.response?.data?.message || 'Failed to add item';
    }
  };

  // 3. Update Cart Item Quantity
  const updateCartItem = async (productId, quantity) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.put(
        `/api/cart/${productId}`,
        { quantity },
        getAuthConfig()
      );
      setCartItems(response.data.items || []);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Failed to update cart item', error);
      setLoading(false);
      throw error.response?.data?.message || 'Failed to update quantity';
    }
  };

  // 4. Remove Item from Cart
  const removeFromCart = async (productId) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/cart/${productId}`,
        getAuthConfig()
      );
      setCartItems(response.data.items || []);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Failed to remove cart item', error);
      setLoading(false);
      throw error.response?.data?.message || 'Failed to remove item';
    }
  };

  // 5. Clear Cart (e.g. after successful checkout order placement)
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
