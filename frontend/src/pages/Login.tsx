import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Left / top side – brand section */}
        <div className="auth-brand">
          <Logo variant="green-logotype" height={50} clickable={false} />
          <h1 className="auth-title">Welcome back! 👋</h1>
          <p className="auth-subtitle">
            Sign in to your MindPlanner account to manage your events, track
            tickets, and stay organized.
          </p>

          <div className="auth-highlight">
            <p className="auth-highlight-title">Why sign in?</p>
            <ul className="auth-highlight-list">
              <li>✓ Access your personalized dashboard</li>
              <li>✓ Manage your events and tickets</li>
              <li>✓ Receive important notifications</li>
            </ul>
          </div>
        </div>

        {/* Right / bottom side – login form card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in</h2>
            <p>Enter your credentials to continue.</p>
          </div>

          {error && (
            <div className="auth-error">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email address</span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="auth-input"
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="auth-input"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
