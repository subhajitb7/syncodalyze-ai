import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.info(`[AUTH] checkAuth pulse: fetching profile from ${axios.defaults.baseURL}/api/auth/profile | withCredentials: ${axios.defaults.withCredentials}`);
        const { data } = await axios.get('/api/auth/profile?t=' + Date.now());
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        console.info('[AUTH] Session verified successfully.');
      } catch (error) {
        // Handle 401 specifically: Clear state ONLY if the error is definitive
        if (error.response?.status === 401) {
          console.warn('[AUTH] No active session found. Clearing user state.');
          // ONLY clear if we don't already have a valid user object from a manual login action
          // mapping the state check inside a setter to get the latest value
          setUser(prev => {
            if (prev) {
              console.log('[AUTH] Shield active: Blocking pulse from clearing existing manual session.');
              return prev;
            }
            localStorage.removeItem('userInfo');
            return null;
          });
        } else {
          console.error(`[AUTH] Profile check failed: ${error.message}`);
          // Fallback to local storage if it's just a network glitch
          const userInfo = localStorage.getItem('userInfo');
          if (userInfo) setUser(JSON.parse(userInfo));
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.info(`[AUTH] Attempting login for ${email}...`);
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
      console.warn(`[AUTH] Login attempt rejected: ${resp?.message || error.message}`, resp);
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
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
