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
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authAPI.login(email, password);

      const data = await res.json();

      if (!data.success) {
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

        <p className="auth-footer">
          New Warrior? <Link to="/signup">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;