import { useState, useEffect } from 'react';
import { Shield, Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Clans.css';
import { clanAPI } from '../api';

function Clans() {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [newClanDesc, setNewClanDesc] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchClans();
  }, []);

  const fetchClans = async () => {
    try {
      const res = await clanAPI.getAll(null);
      const data = await res.json();
      if (data.success) {
        setClans(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClan = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await clanAPI.create(null, { name: newClanName, description: newClanDesc });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchClans();
        toast.success(`Clan '${newClanName}' created successfully!`);
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (err) {
      setError('Failed to create clan');
      toast.error('Failed to create clan');
    }
  };

  const handleJoinClan = async (clanId) => {
    try {
      const res = await clanAPI.join(null, clanId);
      const data = await res.json();
      if (data.success) {
        fetchClans();
        toast.success(data.message || 'Successfully joined clan!');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to join clan');
    }
  };

  return (
    <div className="clans-container">
      <Navbar streak={user?.currentStreak || 0} />
      
      <main className="clans-main">
        <header className="clans-header">
          <div className="header-icon">
            <Shield size={40} />
          </div>
          <h1 className="gold-text">Clans & Alliances</h1>
          <p className="subtitle">Form alliances to conquer greater territories.</p>
          <button className="create-clan-btn gold-shimmer" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} /> Form New Clan
          </button>
        </header>

        {loading ? (
          <div className="loading">Loading Clans...</div>
        ) : (
          <div className="clans-grid">
            {clans.map(clan => (
              <div key={clan._id} className="clan-card">
                <div className="clan-card-header">
                  <h3>{clan.name}</h3>
                  <span className="clan-xp">{clan.totalXp} XP</span>
                </div>
                <p className="clan-desc">{clan.description}</p>
                <div className="clan-card-footer">
                  <div className="clan-members">
                    <Users size={16} />
                    <span>{clan.members?.length || 1} Members</span>
                  </div>
                  <button className="join-btn" onClick={() => handleJoinClan(clan._id)}>
                    Join Clan
                  </button>
                </div>
              </div>
            ))}
            {clans.length === 0 && <p className="no-clans">No clans exist yet. Be the first to form one!</p>}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Form a Clan</h2>
            {error && <p className="error-text">{error}</p>}
            <form onSubmit={handleCreateClan}>
              <input
                type="text"
                placeholder="Clan Name"
                value={newClanName}
                onChange={e => setNewClanName(e.target.value)}
                required
              />
              <textarea
                placeholder="Description"
                value={newClanDesc}
                onChange={e => setNewClanDesc(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn gold-shimmer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clans;
