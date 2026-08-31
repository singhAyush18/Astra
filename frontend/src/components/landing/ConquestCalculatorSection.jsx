import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, MapPin, Flame, Award, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingSections.css';

const ConquestCalculatorSection = () => {
  const [dailyKm, setDailyKm] = useState(6);

  // Calculations based on daily running distance
  const monthlyKm = (dailyKm * 30).toFixed(0);
  const sectorsClaimed = Math.round(dailyKm * 2.8 * 30);
  const caloriesSiege = Math.round(dailyKm * 68 * 30);
  const honorPoints = Math.round(dailyKm * 150 * 30);
  
  // Calculate projected rank after 60 days
  const getRankEstimate = (km) => {
    if (km < 3) return { title: 'Centurion', time: '30 Days' };
    if (km < 7) return { title: 'Legatus Commander', time: '21 Days' };
    if (km < 12) return { title: 'High Warlord', time: '14 Days' };
    return { title: 'Sovereign Emperor', time: '10 Days' };
  };

  const rankEst = getRankEstimate(dailyKm);

  return (
    <section id="conquest-calculator" className="landing-section">
      <div className="calc-wrapper">
        <motion.div
          className="calc-left-col"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-subtitle-badge" style={{ marginBottom: '14px' }}>
            <Calculator size={14} />
            <span>War Simulator</span>
          </div>

          <h3 className="calc-intro-title gold-text">Calculate Your Empire's Growth</h3>
          <p className="calc-intro-p">
            See the sheer scale of territories and glory you will claim simply by maintaining your running routine. Every stride builds your historical dynasty.
          </p>

          <div className="slider-container">
            <div className="slider-top">
              <span className="slider-label">Daily Running Target</span>
              <span className="slider-val-display">{dailyKm} km / day</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={dailyKm}
              onChange={(e) => setDailyKm(Number(e.target.value))}
              className="imperial-range-input"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-stats)' }}>
              <span>1 KM (Cadet)</span>
              <span>10 KM (Warlord)</span>
              <span>25 KM (Mythic)</span>
            </div>
          </div>

          <Link to="/signup" className="hero-cta-primary gold-shimmer" style={{ width: '100%', justifyContent: 'center' }}>
            <span>Claim Your Starting Sector</span>
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        {/* Results Grid */}
        <motion.div
          className="calc-results-grid"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="calc-result-tile">
            <MapPin size={28} className="result-icon" />
            <div className="result-metric">{sectorsClaimed.toLocaleString()}</div>
            <div className="result-title">Monthly Sectors Conquered</div>
          </div>

          <div className="calc-result-tile">
            <Flame size={28} className="result-icon" style={{ color: '#ff7675' }} />
            <div className="result-metric">{(caloriesSiege).toLocaleString()} kcal</div>
            <div className="result-title">Monthly Siege Energy Burned</div>
          </div>

          <div className="calc-result-tile">
            <Award size={28} className="result-icon" style={{ color: '#f0d060' }} />
            <div className="result-metric">{honorPoints.toLocaleString()} PTS</div>
            <div className="result-title">War Honor Contributed to Clan</div>
          </div>

          <div className="calc-result-tile" style={{ borderColor: 'rgba(240, 208, 96, 0.4)', background: 'rgba(25, 20, 50, 0.9)' }}>
            <Crown size={28} className="result-icon" style={{ color: '#f0d060' }} />
            <div className="result-metric gold-text">{rankEst.title}</div>
            <div className="result-title">Reach Rank in ~{rankEst.time}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ConquestCalculatorSection;
