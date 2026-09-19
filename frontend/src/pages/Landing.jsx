import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Crown, Menu, X } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import PillarsOfWarfareSection from '../components/landing/PillarsOfWarfareSection';
import TerritoryConquestSection from '../components/landing/TerritoryConquestSection';
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
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return <div className="realm-loading-screen">Entering Realm...</div>;
  }

  return (
    <div className="astra-landing-root">
      {/* Top Navbar */}
      <nav className={`royal-landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="royal-nav-inner">
          {/* Logo */}
          <div className="royal-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.jpg" alt="Astra Logo" className="landing-nav-logo-img" />
            <span className="royal-nav-title">ASTRA</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="royal-nav-links">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="royal-nav-link">Home</a>
            <a href="#how-it-works" className="royal-nav-link">Features</a>
            <a href="#how-it-works" className="royal-nav-link">How It Works</a>
            <a href="#leaderboard" className="royal-nav-link">Leaderboard</a>
            <Link to="/about" className="royal-nav-link">About</Link>
          </div>

          {/* Right Action Button */}
          <div className="royal-nav-actions">
            <button className="nav-login-link" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="royal-join-btn" onClick={() => navigate('/signup')}>
              Enter Realm
            </button>

            {/* Mobile Toggle */}
            <button
              className="royal-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="royal-mobile-menu">
            <a href="#" onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#leaderboard" onClick={() => setMobileMenuOpen(false)}>Leaderboard</a>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <div className="mobile-menu-divider" />
            <button className="mobile-auth-btn" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
              Sign In
            </button>
            <button className="nav-crimson-btn mobile-full" onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}>
              Join the Kingdom
            </button>
          </div>
        )}
      </nav>

      {/* Main Sections */}
      <main>
        <HeroSection />
        <PillarsOfWarfareSection />
        <TerritoryConquestSection />
        <RankProgressionSection />
        <HallOfConquerorsSection />
        <CallToArmsSection />
      </main>

      <LandingFooter />
    </div>
  );
}

export default Landing;
