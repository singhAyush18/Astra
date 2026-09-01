import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../api";
import "./Login.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      navigate("/login");
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="logo">ASTRA</h1>
          <p className="subtitle">Invalid Reset Link</p>
          <p className="auth-error" style={{ marginBottom: "20px" }}>
            This password reset link is invalid or has expired.
          </p>
          <div style={{ textAlign: "center" }}>
            <Link to="/forgot-password" style={{ color: "#d4af37", textDecoration: "none", fontWeight: "bold" }}>
              Request a New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="logo">ASTRA</h1>
        <p className="subtitle">Set Your New Password</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

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
