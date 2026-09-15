import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Share2, Copy, Check, Sparkles, Smartphone, Square, Loader2 
} from 'lucide-react';
import { generateConquestCard } from '../utils/shareCardGenerator';
import { getRankByLevel, getRankTitle } from '../utils/rankUtils';
import './ShareConquestModal.css';

function ShareConquestModal({ isOpen, onClose, summaryData, user }) {
  const [format, setFormat] = useState('story'); // 'story' | 'square'
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const run = summaryData?.run || {};
  const rankInfo = getRankByLevel(user?.level || 1);
  const rankTitle = getRankTitle(user?.level || 1);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const pathCoords = run?.path && run.path.length > 0 
      ? run.path.map(p => Array.isArray(p) ? p : [p.lat, p.lng])
      : [];

    generateConquestCard({
      format,
      username: user?.username || 'Warrior',
      rankTitle: rankTitle,
      rankIcon: rankInfo.icon,
      level: user?.level || 1,
      distance: run?.distance || 0,
      duration: run?.duration || 0,
      pace: run?.pace || '0:00',
      calories: run?.calories || Math.round((run?.distance || 0) * 65),
      xp: summaryData?.xpEarned || 0,
      path: pathCoords,
      sectorCode: summaryData?.grid?.gridId || '',
      sectorStatus: summaryData?.grid?.claimed 
        ? 'Sector Conquered & Claimed' 
        : summaryData?.grid?.isUsurped 
        ? 'Rival Overthrown & Usurped' 
        : 'Domain Fortified',
    }).then(({ dataUrl, blob }) => {
      if (isMounted) {
        setPreviewUrl(dataUrl);
        setImageBlob(blob);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error generating card:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, format, summaryData, user, rankTitle, rankInfo, run]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Astra-Conquest-${(run?.distance || 0).toFixed(2)}km-${format}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    const text = `⚔️ Just conquered ${(run?.distance || 0).toFixed(2)} km on ASTRA: Stride Wars! Level ${user?.level || 1} ${rankTitle}. Claim territory with me:`;
    const shareUrl = window.location.origin;

    if (navigator.share && imageBlob) {
      try {
        const file = new File([imageBlob], 'astra-conquest.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Astra: Stride Wars Conquest',
            text: `${text} ${shareUrl}`,
          });
          setShared(true);
          setTimeout(() => setShared(false), 2500);
          return;
        }
      } catch (err) {
        console.warn('File share skipped or cancelled:', err);
      }
    }

    // Fallback: Web share without file or copy link
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Astra: Stride Wars Conquest',
          text,
          url: shareUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        return;
      } catch {}
    }

    // Direct clipboard copy fallback
    handleCopyText();
  };

  const handleCopyText = () => {
    const text = `⚔️ Just conquered ${(run?.distance || 0).toFixed(2)} km on ASTRA: Stride Wars! Level ${user?.level || 1} ${rankTitle}. Join my Clan and conquer our city: ${window.location.origin}`;
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
              <h3>Share Your Conquest</h3>
            </div>
            <button className="share-close-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Format Switcher */}
          <div className="share-format-tabs">
            <button 
              className={`format-tab ${format === 'story' ? 'active' : ''}`}
              onClick={() => setFormat('story')}
            >
              <Smartphone size={16} />
              <span>9:16 Story (Insta / WhatsApp)</span>
            </button>
            <button 
              className={`format-tab ${format === 'square' ? 'active' : ''}`}
              onClick={() => setFormat('square')}
            >
              <Square size={16} />
              <span>1:1 Square (Feed / X)</span>
            </button>
          </div>

          {/* Preview Canvas / Card Area */}
          <div className={`share-preview-wrapper ${format}`}>
            {loading ? (
              <div className="share-card-loading">
                <Loader2 size={36} className="spin text-gold" />
                <p>Forging high-res battle card...</p>
              </div>
            ) : (
              <img 
                src={previewUrl} 
                alt="Astra Conquest Card" 
                className={`share-preview-img ${format}`}
              />
            )}
          </div>

          {/* Actions */}
          <div className="share-actions-row">
            <button 
              className="share-action-btn primary-share-btn"
              onClick={handleNativeShare}
            >
              <Share2 size={18} />
              <span>{shared ? 'Shared!' : 'Share to Instagram / Socials'}</span>
            </button>

            <button 
              className="share-action-btn download-btn"
              onClick={handleDownload}
              title="Download image to camera roll"
            >
              <Download size={18} />
              <span>Save Image</span>
            </button>

            <button 
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
