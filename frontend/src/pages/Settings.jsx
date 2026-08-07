import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User as UserIcon, Loader, Trash2, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import "./Settings.css";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";

function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, handleUnauthorized } = useAuth();
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setProfilePicture(user.profilePicture || null);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Image size should be less than 2MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await authAPI.updateProfile(null, {
        username,
        profilePicture
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess("Profile updated successfully!");
        updateUser(data.user);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture(null);
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="settings-container">
      <Navbar streak={user.currentStreak || 0} />
      
      <main className="settings-main">
        <div className="settings-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
            <span>Kingdom</span>
          </button>
          <h2>Account Settings</h2>
        </div>

        <div className="settings-card">
          <h3 className="section-title">Edit Profile</h3>
          
          <form className="settings-form" onSubmit={handleSave}>
            
            {/* Profile Picture Section */}
            <div className="profile-pic-section">
              <div className="profile-pic-preview">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="preview-img" 
                    onClick={() => setIsModalOpen(true)}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <div className="preview-placeholder">
                    <UserIcon size={48} />
                  </div>
                )}
                
                <button 
                  type="button"
                  className="upload-btn" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={16} />
                </button>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              <div className="profile-pic-actions">
                <button 
                  type="button" 
                  className="pic-btn upload-text-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Picture
                </button>
                {profilePicture && (
                  <button 
                    type="button" 
                    className="pic-btn remove-btn"
                    onClick={handleRemovePicture}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                maxLength={20}
                required
              />
              <p className="input-hint">Must be 3-20 characters long.</p>
            </div>

            {/* Messages */}
            {error && <div className="settings-alert error">{error}</div>}
            {success && <div className="settings-alert success">{success}</div>}

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? <Loader size={20} className="spin" /> : "Save Changes"}
            </button>

          </form>
        </div>
      </main>

      {/* Full Screen Image Modal */}
      {isModalOpen && profilePicture && (
        <div className="image-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={profilePicture} alt="Full Profile" className="full-profile-img" />
            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
