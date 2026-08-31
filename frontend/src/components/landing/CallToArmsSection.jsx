import { motion } from 'framer-motion';
import { Sword, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingSections.css';

const CallToArmsSection = () => {
  return (
    <section className="landing-section" style={{ paddingBottom: '60px' }}>
      <motion.div
        className="cta-war-banner"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="cta-sigil-glow">
          <Sword size={36} />
        </div>

        <h2 className="cta-title gold-text">Will You Answer the Call?</h2>
        <p className="cta-sub">
          The realm stands open. Unclaimed lands await your strides, and ancient clans prepare for the next great dawn raid. Lace your boots and claim what is rightfully yours.
        </p>

        <div className="cta-buttons-wrap">
          <Link to="/signup" className="cta-primary-btn gold-shimmer">
            <span>Enlist Now & Claim Land</span>
            <ArrowRight size={20} />
          </Link>
          <Link to="/login" className="cta-secondary-btn">
            <span>Return to Battle</span>
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <ShieldCheck size={16} style={{ color: '#27ae60' }} />
          <span>Free to Play • GPS Enabled • Cross-Platform Web App</span>
        </div>
      </motion.div>
    </section>
  );
};

export default CallToArmsSection;
