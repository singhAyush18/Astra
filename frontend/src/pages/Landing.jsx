import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sword, Menu, X, Shield } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import WarTicker from '../components/landing/WarTicker';
import ConquestAnimationSection from '../components/landing/ConquestAnimationSection';
import TerritoryConquestSection from '../components/landing/TerritoryConquestSection';
import ClanWarfareSection from '../components/landing/ClanWarfareSection';
import PillarsOfWarfareSection from '../components/landing/PillarsOfWarfareSection';
import ConquestCalculatorSection from '../components/landing/ConquestCalculatorSection';
import RankProgressionSection from '../components/landing/RankProgressionSection';
import HallOfConquerorsSection from '../components/landing/HallOfConquerorsSection';
import CallToArmsSection from '../components/landing/CallToArmsSection';
import LandingFooter from '../components/landing/LandingFooter';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return <div className="loading">Entering Realm...</div>;
  }

  return (
    <div className="landing-container">
      {/* Top Navbar */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-logo gold-text">
          <Sword size={22} className="logo-sword-icon" />
          <span>ASTRA</span>
          <span className="logo-sub">STRIDE WARS</span>
        </div>

        {/* Desktop Nav Links */}
        <div className="nav-center-links">
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#territory-conquest" className="nav-link">Tactical Map</a>
          <a href="#clans-section" className="nav-link">Ancient Clans</a>
          <a href="#conquest-calculator" className="nav-link">War Simulator</a>
          <a href="#rank-progression" className="nav-link">Ranks</a>
          <a href="#hall-of-conquerors" className="nav-link">Hall of Fame</a>
        </div>

        <div className="nav-actions">
          <button className="nav-login-btn" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="nav-signup-btn gold-shimmer" onClick={() => navigate('/signup')}>
            <span>Enlist Now</span>
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-dropdown">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#territory-conquest" onClick={() => setMobileMenuOpen(false)}>Tactical Map</a>
            <a href="#clans-section" onClick={() => setMobileMenuOpen(false)}>Ancient Clans</a>
            <a href="#conquest-calculator" onClick={() => setMobileMenuOpen(false)}>War Simulator</a>
            <a href="#rank-progression" onClick={() => setMobileMenuOpen(false)}>Ranks</a>
            <a href="#hall-of-conquerors" onClick={() => setMobileMenuOpen(false)}>Hall of Fame</a>
            <div className="mobile-menu-divider" />
            <button className="mobile-menu-auth-btn" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
              Sign In
            </button>
            <button className="mobile-menu-auth-btn primary" onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}>
              Enlist Now
            </button>
          </div>
        )}
      </nav>

      {/* Main Landing Flow */}
      <main>
        <HeroSection />
        <WarTicker />
        <ConquestAnimationSection />
        <div className="section-divider" />
        <PillarsOfWarfareSection />
        <div className="section-divider" />
        <TerritoryConquestSection />
        <div className="section-divider" />
        <ClanWarfareSection />
        <div className="section-divider" />
        <ConquestCalculatorSection />
        <div className="section-divider" />
        <RankProgressionSection />
        <div className="section-divider" />
        <HallOfConquerorsSection />
        <CallToArmsSection />
      </main>

      <LandingFooter />
    </div>
  );
}

export default Landing;
