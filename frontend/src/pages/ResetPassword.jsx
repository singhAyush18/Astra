import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../api";
import "./Login.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim();
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(Boolean(token));
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Production-grade token pre-validation: check validity immediately on page mount!
  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setIsTokenValid(false);
      setTokenError("Missing password reset token. Please request a new link.");
      return;
    }

    let isMounted = true;
    authAPI
      .verifyResetToken(token)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.valid) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          setTokenError(
            data.message || "This password reset link is invalid or has already been used."
          );
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsTokenValid(false);
        setTokenError("Failed to verify reset link. Please check your internet connection.");
      })
      .finally(() => {
        if (isMounted) setIsValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must be 8-128 chars with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&)."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.resetPassword(token, newPassword);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to reset password.");
        toast.error(data.message || "Failed to reset password.");
        return;
      }

      toast.success("Password reset successfully! You can now log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // State 1: Validating token on load
  if (isValidating) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
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
          <p className="subtitle" style={{ color: "#d4af37" }}>Verifying Realm Token...</p>
          <p style={{ color: "#8a8170", fontSize: "0.9rem", marginTop: "12px" }}>
            Checking the cryptographic authenticity of your reset link.
          </p>
        </div>
      </div>
    );
  }

  // State 2: Invalid, already used, or expired link
  if (!token || !isTokenValid) {
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
          <p className="subtitle" style={{ color: "#ff6b6b" }}>Link Expired or Already Used</p>
          <p className="auth-error" style={{ marginBottom: "20px", textAlign: "center" }}>
            {tokenError || "This password reset link is invalid or has already been used. Reset links can only be used once."}
          </p>
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link 
              to="/forgot-password" 
              style={{ 
                display: "inline-block",
                background: "linear-gradient(135deg, #d4af37, #aa820a)",
                color: "#0a0a1a",
                fontWeight: "bold",
                padding: "12px 24px",
                borderRadius: "8px",
                textDecoration: "none"
              }}
            >
              Request a New Reset Link
            </Link>
          </div>
          <p className="auth-footer" style={{ marginTop: "20px" }}>
            <Link to="/login">Return to Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  // State 3: Valid token -> Render password reset form
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
        <p className="subtitle">Set Your New Password</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              placeholder="Confirm new password"
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

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
