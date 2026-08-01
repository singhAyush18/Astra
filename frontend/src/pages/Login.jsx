import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login fetch error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h1 className="logo">ASTRA</h1>

        <p className="subtitle">
          Run, Conquer, Rule
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>

          {error && <p className="auth-error">{error}</p>}

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

        <p className="auth-footer">
          New Warrior? <Link to="/signup">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;