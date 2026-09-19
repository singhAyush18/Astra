import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone/installed mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Listen for Android/Desktop Chromium PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check session dismissal
      const dismissed = sessionStorage.getItem('astra_install_dismissed');
      if (!dismissed) {
        // Show after 2 seconds for a natural feel
        setTimeout(() => setShowBanner(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. If iOS and not standalone, show banner if not dismissed
    if (isIosDevice && !isStandalone) {
      const dismissed = sessionStorage.getItem('astra_install_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 2500);
      }
    }

    // 5. Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback message for desktop / other browsers
      alert("To install Astra:\nClick the Install icon (⊞ or ⬇) in your browser address bar!");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('astra_install_dismissed', 'true');
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            className="astra-install-banner-wrapper"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="astra-install-banner">
              <div className="install-banner-left">
                <img src="/logo.jpg" alt="Astra Logo" className="install-app-logo" />
                <div className="install-banner-text">
                  <div className="install-app-title">
                    <span>Astra Stride Wars</span>
                    <span className="install-badge">App</span>
                  </div>
                  <p className="install-app-desc">Install for real-time running & full screen</p>
                </div>
              </div>

              <div className="install-banner-actions">
                <button 
                  type="button" 
                  className="install-now-btn"
                  onClick={handleInstallClick}
                >
                  <Download size={16} />
                  <span>Install App</span>
                </button>
                <button 
                  type="button" 
                  className="install-dismiss-btn"
                  onClick={handleDismiss}
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Step-by-Step Installation Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="ios-install-backdrop" onClick={() => setShowIOSModal(false)}>
            <motion.div 
              className="ios-install-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="ios-modal-header">
                <div className="ios-modal-title-row">
                  <img src="/logo.jpg" alt="Astra Logo" className="ios-modal-logo" />
                  <div>
                    <h4>Install Astra on iPhone / iPad</h4>
                    <span>Add to Home Screen in 2 simple taps</span>
                  </div>
                </div>
                <button className="ios-close-btn" onClick={() => setShowIOSModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="ios-steps-list">
                <div className="ios-step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <p>Tap the <strong>Share</strong> button at the bottom of Safari.</p>
                    <div className="step-icon-preview">
                      <Share size={20} className="ios-gold-icon" />
                    </div>
                  </div>
                </div>

                <div className="ios-step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <p>Scroll down and select <strong>"Add to Home Screen"</strong>.</p>
                    <div className="step-icon-preview">
                      <PlusSquare size={20} className="ios-gold-icon" />
                    </div>
                  </div>
                </div>

                <div className="ios-step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <p>Tap <strong>Add</strong> in the top right corner. You're ready to conquer!</p>
                    <div className="step-icon-preview">
                      <CheckCircle size={20} className="ios-green-icon" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="ios-done-btn" onClick={() => setShowIOSModal(false)}>
                Got It!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
