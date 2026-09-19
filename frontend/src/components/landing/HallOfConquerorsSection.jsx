import { motion } from 'framer-motion';
import { ArrowRight, Users, Globe, Trophy, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HallOfConquerorsSection.css';

const REALM_METRICS = [
  { id: 'runners', icon: Users, value: '1.2K+', label: 'RUNNERS' },
  { id: 'territories', icon: Globe, value: '4.8K+', label: 'TERRITORIES' },
  { id: 'distance', icon: Trophy, value: '120K+', label: 'KM TRACKED' }
];

const HallOfConquerorsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="community-section-realm" id="leaderboard">
      <div className="community-inner-wrap">
        {/* Left Column: Heading & Button */}
        <motion.div
          className="community-info-col"
          initial={{ opacity: 0, x: -25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="community-main-title">
            COMPETE. CONQUER.<br />BELONG.
          </h2>
          <p className="community-lead-desc">
            Climb the leaderboards, challenge other runners, and be a part of a growing community that runs for more.
          </p>

          <button
            className="btn-crimson-battle"
            onClick={() => navigate('/leaderboard')}
            style={{ marginTop: '24px' }}
          >
            <span>VIEW LEADERBOARD</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>
        </motion.div>

        {/* Center: Realm Stats Counters */}
        <div className="community-stats-col">
          {REALM_METRICS.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.id}
                className="realm-stat-box"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
              >
                <div className="realm-stat-icon-wrap">
                  <Icon size={26} />
                </div>
                <div className="realm-stat-number">{metric.value}</div>
                <div className="realm-stat-label">{metric.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Right: War Banner Crest */}
        <motion.div
          className="community-banner-col"
          initial={{ opacity: 0, x: 25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="war-flag-container">
            <div className="war-flag-crown">
              <Crown size={40} className="banner-crown-icon" />
            </div>
            <p className="war-flag-motto">
              A STRONGER<br />TOMORROW<br />RUNS TOGETHER.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HallOfConquerorsSection;
