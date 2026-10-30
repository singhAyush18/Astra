import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, Castle, Search, ShieldAlert, Edit3, X, Sparkles, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LiveGridMap from '../components/Map/LiveGridMap';
import './TerritoryMap.css';
import { territoryAPI, authAPI } from '../api';

function TerritoryMap() {
  const [territories, setTerritories] = useState([]);
  const [myTerritories, setMyTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'mine'
  const [searchQuery, setSearchQuery] = useState('');

  // Realm Banner & War Motto Modal State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerFactionInput, setBannerFactionInput] = useState('');
  const [bannerMottoInput, setBannerMottoInput] = useState('');
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  
  const { user, updateUser, handleUnauthorized } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    setTimeout(() => setLoading(true), 0);
    
    const loadTerritories = (coords = null) => {
      const fetchGlobal = territoryAPI.getAll(null, coords)
        .then(res => {
          if (res.status === 401) throw new Error('unauthorized');
          return res.json();
        });

      const fetchMine = territoryAPI.getMine(null)
        .then(res => {
          if (res.status === 401) throw new Error('unauthorized');
          return res.json();
        });

      Promise.all([fetchGlobal, fetchMine])
        .then(([globalData, mineData]) => {
          if (globalData?.success) setTerritories(globalData.data.territories);
          if (mineData?.success) setMyTerritories(mineData.data.territories);
        })
        .catch(err => {
          if (err.message === 'unauthorized') {
            handleUnauthorized();
          } else {
            setError('Failed to load territories');
          }
        })
        .finally(() => setLoading(false));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadTerritories({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => loadTerritories(),
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      loadTerritories();
    }
  }, [user, handleUnauthorized]);

  const handleRename = async (gridId, newName) => {
    try {
      const res = await territoryAPI.nameTerritory(null, gridId, newName);
      const data = await res.json();
      if (data.success) {
        const updateList = (list) => 
          list.map(t => t.gridId === gridId ? { ...t, name: data.data.name } : t);
        
        setTerritories(prev => updateList(prev));
        setMyTerritories(prev => updateList(prev));
        return true;
      } else {
        alert(data.message || 'Failed to rename territory');
        return false;
      }
    } catch {
      alert('Network error while renaming');
      return false;
    }
  };

  const handleUpdateFaction = async (newFaction, newMotto) => {
    try {
      const payload = {};
      if (newFaction !== undefined) payload.faction = newFaction;
      if (newMotto !== undefined) payload.motto = newMotto;

      const res = await authAPI.updateProfile(null, payload);
      const data = await res.json();
      if (data.success && data.user) {
        if (updateUser) updateUser(data.user);
        const myUserId = (user?.id || user?._id || "").toString();
        const updateInList = (list) => 
          list.map(t => (t.rulerId?.toString() === myUserId 
            ? { ...t, rulerFaction: data.user.faction, rulerMotto: data.user.motto } 
            : t));
        
        setTerritories(prev => updateInList(prev));
        setMyTerritories(prev => updateInList(prev));
        toast.success(`Realm banner proclaimed: "${data.user.faction}"!`);
        return true;
      } else {
        toast.error(data.message || 'Failed to update realm banner');
        return false;
      }
    } catch {
      toast.error('Network error while updating realm banner');
      return false;
    }
  };

  const openBannerModal = () => {
    setBannerFactionInput(user?.faction || 'Imperial Vanguard');
    setBannerMottoInput(user?.motto || 'Glory to the swift and fearless.');
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    if (e) e.preventDefault();
    const cleanFac = bannerFactionInput.trim() || 'Imperial Vanguard';
    const cleanMot = bannerMottoInput.trim() || 'Glory to the swift and fearless.';
    setIsSavingBanner(true);
    const success = await handleUpdateFaction(cleanFac, cleanMot);
    setIsSavingBanner(false);
    if (success) {
      setIsBannerModalOpen(false);
    }
  };

  const displayList = activeTab === 'global' ? territories : myTerritories;
  
  const filteredList = displayList.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const rulerName = activeTab === 'mine' ? user?.username : t.rulerName;
    return (
      (t.gridId && t.gridId.toLowerCase().includes(q)) ||
      (rulerName && rulerName.toLowerCase().includes(q)) ||
      (t.name && t.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="territory-container">
      <Navbar streak={user?.currentStreak || 0} />
      
      <main className="territory-main">
        {/* Header */}
        <motion.header 
          className="territory-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-icon">
            <Map size={40} />
          </div>
          <h1 className="gold-text">Realm Territories</h1>
          <p className="subtitle">Every coordinate is a battlefield. Claim your piece of the world.</p>

          {/* User's Empire Faction Banner Card */}
          {user && (
            <div className="user-faction-banner-card">
              <div className="faction-banner-left">
                <span className="faction-crown-icon">👑</span>
                <div className="faction-info">
                  <span className="faction-label">Your Realm Banner</span>
                  <span className="faction-name-display">{user.faction || 'Imperial Vanguard'}</span>
                  <span className="faction-motto-display">"{user.motto || 'Glory to the swift and fearless.'}"</span>
                </div>
              </div>
              <button 
                type="button" 
                className="faction-edit-action-btn"
                onClick={openBannerModal}
                title="Proclaim your Empire Faction & War Motto"
              >
                <Edit3 size={13} />
                <span>Declare Banner</span>
              </button>
            </div>
          )}
        </motion.header>

        {/* Controls */}
        <motion.div 
          className="territory-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => setActiveTab('global')}
            >
              <MapPin size={16} /> Global Map
            </button>
            <button 
              className={`tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
              onClick={() => setActiveTab('mine')}
            >
              <Castle size={16} /> My Kingdom
            </button>
          </div>
          
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by coordinate or ruler..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="territory-loading">
            <div className="loading-spinner" />
            <p>Scouting the realm...</p>
          </div>
        ) : error ? (
          <div className="territory-error">
            <ShieldAlert size={48} />
            <p>{error}</p>
          </div>
        ) : filteredList.length === 0 ? (
          <motion.div 
            className="territory-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Castle size={64} className="empty-icon" />
            <h3>No Territories Found</h3>
            <p>
              {activeTab === 'mine' 
                ? "You haven't claimed any territories yet. Start running to expand your kingdom!" 
                : "No territories match your search."}
            </p>
          </motion.div>
        ) : (
          <div className="territory-map-wrapper">
            <LiveGridMap 
              territories={filteredList} 
              currentUserId={user?.id || user?._id}
              onRename={handleRename}
              onUpdateFaction={openBannerModal}
            />
          </div>
        )}
      </main>

      {/* Declare Realm Banner & War Motto Modal */}
      <AnimatePresence>
        {isBannerModalOpen && (
          <div className="realm-modal-backdrop" onClick={() => setIsBannerModalOpen(false)}>
            <motion.div 
              className="realm-modal-card"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button" 
                className="realm-modal-close-btn"
                onClick={() => setIsBannerModalOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>

              <div className="realm-modal-header">
                <div className="realm-modal-title-row">
                  <Crown size={22} color="#ffd700" />
                  <h3>Declare Realm Banner</h3>
                </div>
                <p className="realm-modal-subtitle">
                  Proclaim your faction banner and war battle cry across every citadel you conquer in the world.
                </p>
              </div>

              {/* Live Citadel Proclamation Preview */}
              <div className="realm-preview-box">
                <div className="realm-preview-header">
                  <span className="realm-preview-tag">
                    <Sparkles size={12} /> Live Citadel Proclamation
                  </span>
                  <span className="realm-preview-count">
                    {myTerritories.length} {myTerritories.length === 1 ? 'Citadel' : 'Citadels'} Fortified
                  </span>
                </div>
                <div className="realm-preview-content">
                  <span className="realm-preview-faction">
                    {bannerFactionInput.trim() || 'Imperial Vanguard'}
                  </span>
                  <span className="realm-preview-motto">
                    "{bannerMottoInput.trim() || 'Glory to the swift and fearless.'}"
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveBanner}>
                {/* Field 1: Faction Banner */}
                <div className="realm-form-group">
                  <div className="realm-form-label-row">
                    <label className="realm-form-label" htmlFor="faction-input">
                      Faction Name
                    </label>
                    <span className="realm-char-count">{bannerFactionInput.length}/30</span>
                  </div>
                  <input
                    id="faction-input"
                    type="text"
                    className="realm-form-input"
                    maxLength={30}
                    placeholder="e.g. Imperial Vanguard, Originals, Solar Paladins..."
                    value={bannerFactionInput}
                    onChange={(e) => setBannerFactionInput(e.target.value)}
                  />
                  <div className="realm-presets-row">
                    {['Imperial Vanguard', 'Originals', 'Solar Paladins', 'Iron Dominion', 'Zephyr Vanguard'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`realm-preset-chip ${bannerFactionInput === preset ? 'active' : ''}`}
                        onClick={() => setBannerFactionInput(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 2: War Motto / Battle Cry */}
                <div className="realm-form-group">
                  <div className="realm-form-label-row">
                    <label className="realm-form-label" htmlFor="motto-input">
                      War Motto / Battle Cry
                    </label>
                    <span className="realm-char-count">{bannerMottoInput.length}/60</span>
                  </div>
                  <input
                    id="motto-input"
                    type="text"
                    className="realm-form-input"
                    maxLength={60}
                    placeholder="e.g. The wind answers only to the swift."
                    value={bannerMottoInput}
                    onChange={(e) => setBannerMottoInput(e.target.value)}
                  />
                  <div className="realm-presets-row">
                    {[
                      'The wind answers only to the swift.',
                      'Speed is our blade. Victory is our bloodline.',
                      'Glory to the swift and fearless.',
                      'Silent in the night, sovereign by the dawn.',
                      'We endure where kingdoms crumble.',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`realm-preset-chip ${bannerMottoInput === preset ? 'active' : ''}`}
                        onClick={() => setBannerMottoInput(preset)}
                      >
                        "{preset}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="realm-modal-footer">
                  <button 
                    type="button" 
                    className="realm-btn-cancel"
                    onClick={() => setIsBannerModalOpen(false)}
                    disabled={isSavingBanner}
                  >
                    Dismiss
                  </button>
                  <button 
                    type="submit" 
                    className="realm-btn-submit"
                    disabled={isSavingBanner}
                  >
                    {isSavingBanner ? 'Proclaiming...' : '⚔️ Proclaim Realm Dominion'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TerritoryMap;
