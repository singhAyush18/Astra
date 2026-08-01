import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/landing/HeroSection';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="landing-container">
      {/* Navbar for Landing */}
      <nav className="landing-nav">
        <div className="nav-logo gold-text">Astra Stride Wars</div>
        <div className="nav-actions">
          <button className="nav-login-btn" onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="nav-signup-btn gold-shimmer" onClick={() => navigate('/signup')}>
            Join Now
          </button>
        </div>
      </nav>

      <main>
        <HeroSection />
        
        {/* Additional sections can go here in the future, e.g. How It Works, Features */}
      </main>
    </div>
  );
}

export default Landing;
