import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastCheckRef = useRef(0);

  const logout = useCallback(async (reason) => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    
    localStorage.removeItem('user');
    setUser(null);

    if (reason) {
      toast.error(reason, { id: 'auth-session-toast', duration: 5000 });
    } else {
      toast('You have logged out', { icon: '👋', id: 'logout-toast' });
    }
  }, []);

  const handleUnauthorized = useCallback((reason) => {
    logout(reason || 'Your session has expired. Please log in again.');
  }, [logout]);

  const checkSession = useCallback(async () => {
    // Throttle check to at most once every 10 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 10000) return;
    lastCheckRef.current = now;

    try {
      const res = await authAPI.getMe();
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        handleUnauthorized(
          data.message || 'You have been logged out because this account was logged into from another device.'
        );
      } else if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser((prev) => {
            if (prev && JSON.stringify(prev) === JSON.stringify(data.user)) {
              return prev;
            }
            return data.user;
          });
        }
      }
    } catch {
      // Ignore network failures for background session checks
    }
  }, [handleUnauthorized]);

  // Initialize from localStorage on mount & verify session with server
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.lastRunDate && parsed?.currentStreak > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const lastRun = new Date(parsed.lastRunDate);
          lastRun.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((today - lastRun) / (1000 * 60 * 60 * 24));
          if (diffDays > 1) {
            parsed.currentStreak = 0;
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        }
        setUser(parsed);
        // Verify with server on startup
        checkSession();
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, [checkSession]);

  // Listen to unauthorized events & tab changes
  useEffect(() => {
    const handleAuthUnauthorizedEvent = (e) => {
      const msg = e.detail?.message || 'You have been logged out because this account was logged into from another device.';
      handleUnauthorized(msg);
    };

    const handleStorage = (e) => {
      if (e.key === 'user') {
        if (!e.newValue) {
          setUser(null);
        } else {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            // ignore
          }
        }
      }
    };

    const handleWindowFocus = () => {
      if (localStorage.getItem('user')) {
        checkSession();
      }
    };

    window.addEventListener('auth:unauthorized', handleAuthUnauthorizedEvent);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && localStorage.getItem('user')) {
        checkSession();
      }
    });

    return () => {
      window.removeEventListener('auth:unauthorized', handleAuthUnauthorizedEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [handleUnauthorized, checkSession]);

  const login = (newUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    toast.success(`Welcome back, ${newUser.username}!`);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    handleUnauthorized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
