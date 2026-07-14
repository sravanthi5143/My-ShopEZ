import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine the socket URL from the environment or default to local backend
    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    
    console.log('[Socket.IO] Attempting to connect to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected successfully with ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
