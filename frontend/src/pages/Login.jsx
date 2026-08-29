import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./Login.css";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);

    try {
      const res = await authAPI.login(email, password);

      const data = await res.json();

      if (!data.success) {
        if (res.status === 403) {
          setNeedsVerification(true);
        }
        toast.error(data.message);
        return;
      }

      login(data.user);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login fetch error:", err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const res = await authAPI.resendVerification(email);
      const data = await res.json();
      toast.success(data.message || "Verification email sent! Check your inbox.");
    } catch (err) {
      toast.error("Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h1 className="logo">ASTRA</h1>

        <p className="subtitle">
          Enter the realm
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Entering..." : "Enter the Realm"}
          </button>
        </form>

        {needsVerification && (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <p style={{ color: "#f87171", fontSize: "0.9rem", marginBottom: "10px", fontFamily: "'Inter', sans-serif" }}>
              Your email is not verified yet.
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              style={{
                padding: "10px 20px",
                border: "1px solid #d4af37",
                borderRadius: "8px",
                background: "transparent",
                color: "#d4af37",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontFamily: "'Inter', sans-serif",
                transition: "0.3s",
              }}
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
          </div>
        )}

        <p className="auth-footer">
          New Warrior? <Link to="/signup">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;