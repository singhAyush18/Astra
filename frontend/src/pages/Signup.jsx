import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Crown } from "lucide-react";
import toast from "react-hot-toast";
import "./Login.css";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.register(username, email, password);

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      toast.success(data.message || "Check your email for a verification link!");
      navigate("/login");
    } catch (err) {
      console.error("Signup fetch error:", err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <img 
            src="/logo.jpg" 
            alt="Astra Logo" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              border: '2px solid rgba(212, 175, 55, 0.6)', 
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
              objectFit: 'cover'
            }} 
          />
        </div>

        <h1 className="logo">ASTRA</h1>

        <p className="subtitle">
          Forge your destiny
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Choose your warrior name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Forging..." : "Join the Kingdom"}
          </button>
        </form>

        <p className="auth-footer">
          Already a Warrior? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;