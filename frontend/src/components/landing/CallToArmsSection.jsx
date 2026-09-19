import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ctaBg from '../../assets/cta_bg.jpg';
import './CallToArmsSection.css';

const CallToArmsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="cta-sunset-realm" style={{ backgroundImage: `url(${ctaBg})` }}>
      <div className="cta-sunset-overlay" />

      <div className="cta-sunset-content">
        <motion.h2
          className="cta-sunset-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          RUN TODAY.<br />RULE TOMORROW.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <button
            className="btn-crimson-battle"
            onClick={() => navigate('/signup')}
          >
            <span>JOIN THE KINGDOM</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToArmsSection;
