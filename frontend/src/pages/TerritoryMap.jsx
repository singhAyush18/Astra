import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, Flag, Crown, Search, ShieldAlert } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import LiveGridMap from '../components/Map/LiveGridMap';
import './TerritoryMap.css';

function TerritoryMap() {
  const [territories, setTerritories] = useState([]);
  const [myTerritories, setMyTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'mine'
  const [searchQuery, setSearchQuery] = useState('');
  
  const { token, user, handleUnauthorized } = useAuth();

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    
    // Fetch all claimed territories
    const fetchGlobal = fetch(`/api/territories`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.status === 401) throw new Error('unauthorized');
      return res.json();
    });

    // Fetch user's territories
    const fetchMine = fetch(`/api/territories/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
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
  }, [token, handleUnauthorized]);

  const displayList = activeTab === 'global' ? territories : myTerritories;
  
  const filteredList = displayList.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const rulerName = activeTab === 'mine' ? user?.username : t.rulerName;
    return (
      (t.gridId && t.gridId.toLowerCase().includes(q)) ||
      (rulerName && rulerName.toLowerCase().includes(q))
    );
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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
              <Flag size={16} /> My Kingdom
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
            <Flag size={64} className="empty-icon" />
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
              currentUserId={user?.id}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default TerritoryMap;
