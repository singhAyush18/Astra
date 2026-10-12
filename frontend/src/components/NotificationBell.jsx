import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCheck, Trash2, Swords, Crown, Flame, 
  Clock, ShieldAlert, Sparkles, ChevronRight, X 
} from 'lucide-react';
import { notificationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './NotificationBell.css';

// Subtle Web Audio sound for new royal alerts
const playDispatchChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio contexts might be blocked until user interacts, safely ignore
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const prevUnreadRef = useRef(0);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async (silent = true) => {
    if (!isAuthenticated) return;
    if (!silent) setLoading(true);

    try {
      const res = await notificationsAPI.getAll(null, { limit: 25 });
      const data = await res.json();

      if (res.ok && data) {
        setNotifications(data.notifications || []);
        const newUnread = data.unreadCount || 0;
        
        // If unread count increased, play regal chime
        if (newUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
          playDispatchChime();
        }
        prevUnreadRef.current = newUnread;
        setUnreadCount(newUnread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load and periodic polling every 45s
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(false);
      const interval = setInterval(() => {
        fetchNotifications(true);
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications(true);
    }
  };

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await notificationsAPI.markAsRead(null, notifId);
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationsAPI.markAllAsRead(null);
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await notificationsAPI.delete(null, notifId);
      if (res.ok) {
        const target = notifications.find((n) => n._id === notifId);
        if (target && !target.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await handleMarkAsRead(notif._id);
    }
    setIsOpen(false);

    if (notif.data?.actionUrl) {
      navigate(notif.data.actionUrl);
    } else if (notif.type.includes('territory')) {
      navigate('/territories');
    } else {
      navigate('/dashboard');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const getNotifMeta = (type) => {
    switch (type) {
      case 'territory_attacked':
        return {
          icon: <Swords size={18} className="notif-type-icon text-red" />,
          accentClass: 'border-red-subtle',
          label: 'Siege Alert',
        };
      case 'territory_usurped':
        return {
          icon: <Crown size={18} className="notif-type-icon text-gold" />,
          accentClass: 'border-gold-subtle',
          label: 'Dominion Lost',
        };
      case 'streak_danger':
        return {
          icon: <Flame size={18} className="notif-type-icon text-orange" />,
          accentClass: 'border-orange-subtle',
          label: 'Streak at Risk',
        };
      case 'absence_dormancy':
        return {
          icon: <Clock size={18} className="notif-type-icon text-blue" />,
          accentClass: 'border-blue-subtle',
          label: 'Absence Notice',
        };
      default:
        return {
          icon: <ShieldAlert size={18} className="notif-type-icon text-gold" />,
          accentClass: '',
          label: 'Dispatch',
        };
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        className={`notif-bell-button ${isOpen ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleToggle}
        aria-label="War Notifications & Dispatches"
        title="Royal War Dispatches"
      >
        <Bell size={20} className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notif-badge">
            <span className="notif-badge-pulse" />
            <span className="notif-badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notif-dropdown"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="notif-header">
              <div className="notif-header-title">
                <span className="realm-title">War Dispatches</span>
                {unreadCount > 0 && (
                  <span className="unread-counter-tag">{unreadCount} unread</span>
                )}
              </div>
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button
                    className="notif-action-btn"
                    onClick={handleMarkAllAsRead}
                    title="Mark all as read"
                  >
                    <CheckCheck size={15} /> Mark read
                  </button>
                )}
                <button
                  className="notif-close-icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="notif-tabs">
              <button
                className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({notifications.length})
              </button>
              <button
                className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications Body */}
            <div className="notif-body custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="notif-loading">
                  <div className="notif-spinner" />
                  <span>Summoning dispatches...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="notif-empty">
                  <div className="notif-empty-icon">🛡️</div>
                  <div className="notif-empty-title">All Quiet in the Realm</div>
                  <div className="notif-empty-desc">
                    {activeTab === 'unread'
                      ? 'No unread alerts. Your borders and flame remain secure.'
                      : 'No wartime incidents or absence alerts recorded yet.'}
                  </div>
                </div>
              ) : (
                <div className="notif-list">
                  {filteredNotifications.map((notif) => {
                    const meta = getNotifMeta(notif.type);
                    return (
                      <div
                        key={notif._id}
                        className={`notif-item ${notif.read ? 'is-read' : 'is-unread'} ${meta.accentClass}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notif-icon-col">
                          {meta.icon}
                        </div>
                        <div className="notif-content-col">
                          <div className="notif-top-row">
                            <span className="notif-category">{meta.label}</span>
                            <span className="notif-time">{formatTimeAgo(notif.createdAt)}</span>
                          </div>
                          <h4 className="notif-item-title">{notif.title}</h4>
                          <p className="notif-item-message">{notif.message}</p>
                          <div className="notif-footer-row">
                            <span className="notif-action-link">
                              Inspect Realm <ChevronRight size={13} />
                            </span>
                            <div className="notif-item-actions">
                              {!notif.read && (
                                <button
                                  className="notif-mini-btn"
                                  title="Mark as read"
                                  onClick={(e) => handleMarkAsRead(notif._id, e)}
                                >
                                  <CheckCheck size={13} />
                                </button>
                              )}
                              <button
                                className="notif-mini-btn delete"
                                title="Dismiss"
                                onClick={(e) => handleDelete(notif._id, e)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="notif-dropdown-footer">
              <span className="footer-realm-note">
                ⚡ Real-time alerts delivered to your inbox & command deck
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
