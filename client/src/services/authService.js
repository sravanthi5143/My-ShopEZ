import axios from 'axios';

const API_URL = '/api/auth';

// Register User
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  if (response.data) {
    const userToStore = response.data.user ? {
      ...response.data.user,
      token: response.data.token,
      role: response.data.role || response.data.user.role
    } : response.data;
    localStorage.setItem('user', JSON.stringify(userToStore));
    return userToStore;
  }
  return response.data;
};

// Login Userr
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  if (response.data) {
    const userToStore = response.data.user ? {
      ...response.data.user,
      token: response.data.token,
      role: response.data.role || response.data.user.role
    } : response.data;
    localStorage.setItem('user', JSON.stringify(userToStore));
    return userToStore;
  }
  return response.data;
};

// Logout User
const logout = () => {
  localStorage.removeItem('user');
};

const authService = {
  register,
  login,
  logout,
};

export default authService;
