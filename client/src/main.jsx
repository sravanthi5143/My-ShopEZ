import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ThemeProvider } from './context/ThemeContext'

import { SocketProvider } from './context/SocketContext'

// Set default URL base for Axios to target Express backend
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SocketProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <App />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SocketProvider>
    </ThemeProvider>
  </StrictMode>,
)
