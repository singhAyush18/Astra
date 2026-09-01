import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../api";
import "./Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        toast.success("Password reset email sent! Check your inbox.");
      } else {
        toast.error(data.message || "Failed to send reset link.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="logo">ASTRA</h1>
        <p className="subtitle">Recover Your Realm Access</p>

        {submitted ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#4ade80", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px", fontFamily: "'Inter', sans-serif" }}>
              If an account with that email exists, we have dispatched a password reset link. Please check your inbox and spam folder.
            </p>
            <Link to="/login" style={{ color: "#d4af37", textDecoration: "none", fontWeight: "bold" }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Remembered password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
