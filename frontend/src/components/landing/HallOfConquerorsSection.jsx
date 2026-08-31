import { motion } from 'framer-motion';
import { Trophy, ScrollText, Flame, Shield, MapPin, Crown } from 'lucide-react';
import './LandingSections.css';

const TOP_RULERS = [
  { rank: 1, name: 'Imperator Marcus', clan: 'Solar Paladins', km: '1,420.5 km', territories: '84 Sectors', streak: '62 Days' },
  { rank: 2, name: 'Valkyrie Freya', clan: 'Crimson Warlords', km: '1,288.0 km', territories: '76 Sectors', streak: '48 Days' },
  { rank: 3, name: 'Lord Kaelen', clan: 'Shadow Dynasty', km: '1,154.2 km', territories: '69 Sectors', streak: '35 Days' },
  { rank: 4, name: 'Tribune Leonidas', clan: 'Emerald Vanguard', km: '984.7 km', territories: '58 Sectors', streak: '29 Days' },
  { rank: 5, name: 'High Priestess Elena', clan: 'Solar Paladins', km: '912.4 km', territories: '52 Sectors', streak: '41 Days' },
];

const DISPATCHES = [
  {
    quote: "“Before Astra, running was a chore I had to force myself into. Now I wake up at 5:30 AM just to ensure our clan retains the northern bridge before the Crimson Warlords wake up.”",
    author: "Warlord Jason K.",
    regiment: "Solar Paladins — 480 KM Conquered"
  },
  {
    quote: "“The territory conquest is addictive. Running through my city feels like mapping out a medieval campaign. We held 14 city blocks for three unbroken weeks.”",
    author: "Legatus Samantha V.",
    regiment: "Shadow Dynasty — 620 KM Conquered"
  },
  {
    quote: "“My marathon training turned into a full-scale siege warfare. The clan raid mechanics push you to complete those final 3 kilometers when your legs want to quit.”",
    author: "Centurion David R.",
    regiment: "Crimson Warlords — 850 KM Conquered"
  }
];

const HallOfConquerorsSection = () => {
  return (
    <section id="hall-of-conquerors" className="landing-section">
      <div className="section-header-wrap">
        <motion.div
          className="section-subtitle-badge"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Trophy size={14} />
          <span>Hall of Fame</span>
        </motion.div>
        <h2 className="section-main-title gold-text">Hall of Conquerors</h2>
        <p className="section-lead-text">
          Immortalized in stone and gold. See the realm's foremost warlords and read their battle dispatches from the front lines of conquest.
        </p>
      </div>

      <div className="conquerors-layout">
        {/* Live Leaderboard Podium */}
        <motion.div
          className="podium-card"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="podium-header">
            <Crown size={22} style={{ color: '#f1c40f' }} />
            <span>Realm Sovereign Leaderboard</span>
          </div>

          <div className="leaderboard-mini-list">
            {TOP_RULERS.map((ruler) => (
              <div key={ruler.rank} className="leader-item-row">
                <div className="leader-info-left">
                  <div className={`leader-rank-badge ${ruler.rank <= 3 ? `rank-${ruler.rank}` : 'rank-other'}`}>
                    {ruler.rank}
                  </div>
                  <div>
                    <div className="leader-name-tag">{ruler.name}</div>
                    <div className="leader-clan-sub">{ruler.clan} • {ruler.streak} Streak</div>
                  </div>
                </div>

                <div className="leader-stats-right">
                  <div className="leader-dist-val">{ruler.km}</div>
                  <div className="leader-territories-sub">{ruler.territories}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dispatches from the Front */}
        <motion.div
          className="chronicles-card-deck"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="podium-header" style={{ marginBottom: '8px' }}>
            <ScrollText size={22} style={{ color: 'var(--gold-primary)' }} />
            <span>Dispatches from the Front Lines</span>
          </div>

          {DISPATCHES.map((dispatch, i) => (
            <div key={i} className="dispatch-card">
              <p className="dispatch-quote">{dispatch.quote}</p>
              <div className="dispatch-author">
                <span className="dispatch-author-name">{dispatch.author}</span>
                <span className="dispatch-regiment">{dispatch.regiment}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HallOfConquerorsSection;
