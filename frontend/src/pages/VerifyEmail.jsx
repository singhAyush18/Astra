import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../api";
import "./Login.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }

    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [searchParams]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Please enter your email");
      return;
    }

    setResending(true);
    try {
      const res = await authAPI.resendVerification(resendEmail);
      const data = await res.json();
      toast.success(data.message || "Verification email sent!");
    } catch (err) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="logo">ASTRA</h1>

        {status === "loading" && (
          <>
            <p className="subtitle">Verifying your email...</p>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div className="verify-spinner"></div>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <p className="subtitle" style={{ color: "#4ade80" }}>
              ✅ {message}
            </p>
            <Link to="/login">
              <button
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#d4af37",
                  color: "black",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "1rem",
                  marginTop: "20px",
                }}
              >
                Proceed to Login
              </button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="subtitle" style={{ color: "#f87171" }}>
              ❌ {message}
            </p>

            <p
              className="subtitle"
              style={{ fontSize: "0.9rem", marginTop: "20px", marginBottom: "10px" }}
            >
              Need a new verification link?
            </p>

            <form onSubmit={handleResend} className="auth-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={resending}>
                {resending ? "Sending..." : "Resend Verification Email"}
              </button>
            </form>
          </>
        )}

        <p className="auth-footer" style={{ marginTop: "24px" }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
