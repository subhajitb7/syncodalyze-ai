import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const { data } = await axios.get('/api/auth/profile');
          setUser(data);
          localStorage.setItem('userInfo', JSON.stringify(data));
        } catch (error) {
          console.error('Session sync failed:', error);
          if (error.response?.status === 401 || error.response?.status === 404) {
            setUser(null);
            localStorage.removeItem('userInfo');
          } else {
            // Fallback to local storage if server is down but session might be valid
            setUser(JSON.parse(userInfo));
          }
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && !socket) {
      const s = io('http://localhost:5001');
      s.emit('join', user._id);
      setSocket(s);
    } else if (!user && socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user, socket]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      if (data.needsVerification) {
        return { success: false, needsVerification: true, email: data.email, message: data.message };
      }
      if (data.requires2fa) {
        return { success: false, requires2fa: true, email: data.email, message: data.message };
      }
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      const resp = error.response?.data;
      if (resp?.needsVerification) {
        return { success: false, needsVerification: true, email: resp.email, message: resp.message };
      }
      if (error.response?.status === 202 && resp?.requires2fa) {
        return { success: false, requires2fa: true, email: resp.email, message: resp.message };
      }
      return { success: false, message: resp?.message || 'Login failed' };
    }
  };



  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      if (data.needsVerification) {
        return { success: false, needsVerification: true, email, message: data.message };
      }
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error(error);
    }
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading, socket }}>
      {children}
    </AuthContext.Provider>
  );
};
