import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

  // Initialize from localStorage on mount
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
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    toast.success(`Welcome back, ${newUser.username}!`);
  };

  const logout = () => {
    if (user) {
      toast('You have logged out', { icon: '👋', id: 'logout-toast' });
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event('profileUpdated'));
  };

  // Handle 401 responses — centralised session expiry
  const handleUnauthorized = () => {
    logout();
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
