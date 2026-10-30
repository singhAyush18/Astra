import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Share2, Copy, Check, Sparkles, Smartphone, Square, Loader2,
  Camera, Image as ImageIcon, Trash2, Palette
} from 'lucide-react';
import { generateStravaPhotoCard } from '../utils/shareCardGenerator';
import './ShareConquestModal.css';

const ROUTE_COLORS = [
  { id: 'gold', name: 'Neon Gold', color: '#ffd700', glow: '#ffd700' },
  { id: 'orange', name: 'Blaze Orange', color: '#fc5200', glow: '#fc5200' },
  { id: 'white', name: 'Crisp White', color: '#ffffff', glow: '#ffffff' },
  { id: 'cyan', name: 'Cyan Glow', color: '#00e5ff', glow: '#00e5ff' },
];

function ShareConquestModal({ isOpen, onClose, summaryData, user }) {
  const [format, setFormat] = useState('story'); // 'story' | 'square'
  const [userPhoto, setUserPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [routeColor, setRouteColor] = useState('#ffd700'); // Neon Gold default
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const fileInputRef = useRef(null);

  // Normalize run data regardless of whether opened from RunSummary or RunHistory
  const run = useMemo(() => summaryData?.run || summaryData || {}, [summaryData]);

  // Handle User Photo Picker
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserPhoto(file);
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setUserPhoto(null);
    setPhotoPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setTimeout(() => {
      if (isMounted) setLoading(true);
    }, 0);

    const pathCoords = run?.path && run.path.length > 0 
      ? run.path
          .map((p) => (Array.isArray(p) ? p : [p?.lat ?? p?.latitude, p?.lng ?? p?.longitude]))
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
      : [];

    const runDate = run?.startTime || run?.createdAt || new Date();
    const sectorCode = summaryData?.grid?.gridId || run?.gridId || '';

    generateStravaPhotoCard({
      format,
      photo: userPhoto,
      distance: run?.distance || 0,
      duration: run?.duration || 0,
      pace: run?.pace || '0:00',
      date: runDate,
      path: pathCoords,
      routeColor: routeColor,
      username: user?.username || '',
      sectorName: sectorCode,
    })
      .then(({ dataUrl, blob }) => {
        if (isMounted) {
          setPreviewUrl(dataUrl);
          setImageBlob(blob);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error generating photo story card:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, format, userPhoto, routeColor, summaryData, user, run]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Astra-Story-${(run?.distance || 0).toFixed(2)}km-${format}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    const text = `⚔️ Just crushed ${(run?.distance || 0).toFixed(2)} km on ASTRA: Stride Wars! Track and conquer territory with me:`;
    const shareUrl = window.location.origin;

    if (navigator.share && imageBlob) {
      try {
        const file = new File([imageBlob], 'astra-run.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Astra Run Story',
            text: `${text} ${shareUrl}`,
          });
          setShared(true);
          setTimeout(() => setShared(false), 2500);
          return;
        }
      } catch (err) {
        console.warn('File share cancelled or failed:', err);
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Astra: Stride Wars',
          text,
          url: shareUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        return;
      } catch (err) {
        console.debug('Native share cancelled or unsupported:', err);
      }
    }

    handleCopyText();
  };

  const handleCopyText = () => {
    const text = `⚔️ Just logged ${(run?.distance || 0).toFixed(2)} km on ASTRA: Stride Wars! Join my clan and conquer the city: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="share-modal-backdrop" onClick={onClose}>
        <motion.div 
          className="share-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="share-modal-header">
            <div className="share-modal-title">
              <Sparkles size={20} className="text-gold" />
              <h3>Share Your Run</h3>
            </div>
            <button className="share-close-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Photo Picker Drawer */}
          <div className="photo-picker-section">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
            
            {!userPhoto ? (
              <button
                type="button"
                className="photo-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={18} className="text-gold" />
                <div className="photo-upload-text">
                  <span className="photo-upload-title">Add Post-Run Photo</span>
                  <span className="photo-upload-sub">Upload selfie, scenery, or workout pic</span>
                </div>
              </button>
            ) : (
              <div className="photo-selected-bar">
                <div className="photo-thumb-wrap">
                  <img src={photoPreviewUrl} alt="Run snapshot" className="photo-thumb" />
                  <span className="photo-name">Photo Attached</span>
                </div>
                <div className="photo-actions">
                  <button
                    type="button"
                    className="photo-btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={14} />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    className="photo-btn-danger"
                    onClick={handleRemovePhoto}
                    title="Remove photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Route Color Selector */}
            <div className="route-color-row">
              <div className="route-color-label">
                <Palette size={13} />
                <span>Route Color:</span>
              </div>
              <div className="route-color-pills">
                {ROUTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-pill ${routeColor === c.color ? 'active' : ''}`}
                    onClick={() => setRouteColor(c.color)}
                    style={{ '--pill-color': c.color }}
                    title={c.name}
                  >
                    <span className="color-swatch" style={{ background: c.color }} />
                    <span className="color-name">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect Ratio Format Switcher */}
          <div className="share-format-tabs">
            <button 
              type="button"
              className={`format-tab ${format === 'story' ? 'active' : ''}`}
              onClick={() => setFormat('story')}
            >
              <Smartphone size={16} />
              <span>9:16 Story (Insta / WhatsApp)</span>
            </button>
            <button 
              type="button"
              className={`format-tab ${format === 'square' ? 'active' : ''}`}
              onClick={() => setFormat('square')}
            >
              <Square size={16} />
              <span>1:1 Square (Feed / X)</span>
            </button>
          </div>

          {/* Preview Canvas Area */}
          <div className={`share-preview-wrapper ${format}`}>
            {loading ? (
              <div className="share-card-loading">
                <Loader2 size={36} className="spin text-gold" />
                <p>Rendering story card...</p>
              </div>
            ) : (
              <img 
                src={previewUrl} 
                alt="Astra Run Story" 
                className={`share-preview-img ${format}`}
              />
            )}
          </div>

          {/* Actions */}
          <div className="share-actions-row">
            <button 
              type="button"
              className="share-action-btn primary-share-btn"
              onClick={handleNativeShare}
            >
              <Share2 size={18} />
              <span>{shared ? 'Shared!' : 'Share to Instagram / Socials'}</span>
            </button>

            <button 
              type="button"
              className="share-action-btn download-btn"
              onClick={handleDownload}
              title="Download image to camera roll"
            >
              <Download size={18} />
              <span>Save High-Res Image</span>
            </button>

            <button 
              type="button"
              className="share-action-btn copy-btn"
              onClick={handleCopyText}
              title="Copy brag text and invite link"
            >
              {copied ? <Check size={18} className="text-green" /> : <Copy size={18} />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ShareConquestModal;
