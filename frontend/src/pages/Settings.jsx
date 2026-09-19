import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User as UserIcon, Loader, Trash2, ArrowLeft, Volume2, VolumeX, Eye, EyeOff, ShieldCheck, Mail, Send, RotateCw } from "lucide-react";
import Navbar from "../components/Navbar";
import "./Settings.css";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";
import { soundEffects } from "../utils/soundEffects";

function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, handleUnauthorized } = useAuth();
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP Verification state
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  
  // Tactical Audio & Voice Announcer State
  const [isAudioMuted, setIsAudioMuted] = useState(soundEffects.isMuted);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('astra_voice_name') || 'auto-male');

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        setVoiceOptions(voices);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  
  const fileInputRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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

  const validatePasswordForm = () => {
    if (!currentPassword) {
      setPwdError("Current password is required");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match");
      return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;
    if (!passwordRegex.test(newPassword)) {
      setPwdError(
        "Password must be 8-128 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      );
      return false;
    }
    if (currentPassword === newPassword) {
      setPwdError("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    setPwdError("");
    setPwdSuccess("");

    if (!validatePasswordForm()) return;

    setOtpLoading(true);
    try {
      const res = await authAPI.requestPasswordChangeOtp(null, currentPassword);

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCountdown(60); // 60s cooldown
        setPwdSuccess(data.message || "Verification code sent to your email!");
      } else {
        setPwdError(data.message || "Failed to send verification code");
      }
    } catch (err) {
      setPwdError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!validatePasswordForm()) return;

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      setPwdError("Please enter the 6-digit verification code sent to your email");
      return;
    }

    setPwdLoading(true);

    try {
      const res = await authAPI.changePassword(null, {
        currentPassword,
        newPassword,
        otpCode: otpCode.trim(),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (data.success) {
        setPwdSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpCode("");
        setOtpSent(false);
        setCountdown(0);
      } else {
        setPwdError(data.message || "Failed to change password");
      }
    } catch (err) {
      setPwdError("Network error. Please try again.");
    } finally {
      setPwdLoading(false);
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

        {/* Profile Card */}
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

        {/* Change Password Card */}
        <div className="settings-card" style={{ marginTop: "24px" }}>
          <h3 className="section-title">Change Password</h3>

          <form className="settings-form" onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="input-hint">
                8+ characters with uppercase, lowercase, number, & special character (@$!%*?&).
              </p>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* OTP Code Input (Visible after requesting code) */}
            {otpSent && (
              <div className="form-group otp-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ color: "#ffd700", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={16} /> 6-Digit Email Code
                  </label>
                  <button
                    type="button"
                    className="otp-resend-btn"
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || otpLoading}
                  >
                    {otpLoading ? (
                      <Loader size={12} className="spin" />
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <RotateCw size={12} /> Resend Code
                      </span>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="otp-code-input"
                  required
                  autoFocus
                />
                <p className="input-hint">
                  Check your registered email inbox for the 6-digit code (valid for 10 minutes).
                </p>
              </div>
            )}

            {pwdError && <div className="settings-alert error">{pwdError}</div>}
            {pwdSuccess && <div className="settings-alert success">{pwdSuccess}</div>}

            {!otpSent ? (
              <button 
                type="button" 
                className="save-btn otp-request-btn" 
                onClick={handleSendOtp}
                disabled={otpLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {otpLoading ? (
                  <Loader size={20} className="spin" />
                ) : (
                  <>
                    <Send size={18} style={{ marginRight: "8px" }} />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            ) : (
              <button type="submit" className="save-btn" disabled={pwdLoading || otpCode.length !== 6}>
                {pwdLoading ? (
                  <Loader size={20} className="spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} style={{ marginRight: "8px" }} />
                    <span>Verify & Change Password</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Battle SFX & Tactical Voice Announcer Setting */}
        <div className="settings-card" style={{ marginTop: "24px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>Battle SFX & Voice Audio</h3>
              <p className="input-hint" style={{ margin: '4px 0 0 0' }}>
                Procedural audio for territory conquests, war horns, and tactical voice announcements.
              </p>
            </div>
            <button
              type="button"
              className="pic-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isAudioMuted ? 'rgba(255, 75, 75, 0.12)' : 'rgba(0, 229, 255, 0.12)',
                color: isAudioMuted ? '#ff5252' : '#00e5ff',
                borderColor: isAudioMuted ? '#ff5252' : '#00e5ff',
                cursor: 'pointer'
              }}
              onClick={() => {
                const newMuted = soundEffects.toggleMute();
                setIsAudioMuted(newMuted);
                if (!newMuted) {
                  soundEffects.playVictoryFanfare();
                }
              }}
            >
              {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isAudioMuted ? "Muted" : "Enabled"}</span>
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontWeight: '600', fontSize: '0.9rem' }}>
              🎙️ Tactical Announcer Voice
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="settings-input"
                style={{
                  flex: 1,
                  minWidth: '220px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
                value={selectedVoice}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                  localStorage.setItem('astra_voice_name', e.target.value);
                }}
              >
                <option value="auto-male">⚡ Tactical Commander (Male Default - Auto Select)</option>
                {voiceOptions.map((v) => (
                  <option key={v.voiceURI || v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  soundEffects.speakAnnouncement("Sector captured! Outstanding effort Commander, your empire expands.");
                }}
              >
                🔊 Test Announcer
              </button>
            </div>
            <p className="input-hint" style={{ marginTop: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              By default, Astra automatically selects the best available Male voice in your browser (e.g. Google UK English Male, Microsoft David, or Daniel).
            </p>
          </div>
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
