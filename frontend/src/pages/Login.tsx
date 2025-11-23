import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css"; // <-- add this

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
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Left / top side – brand + vibes */}
        <div className="auth-brand">
          <div className="auth-pill">Event Planner</div>
          <h1 className="auth-title">Welcome back, Toshi 👋</h1>
          <p className="auth-subtitle">
            Sign in to manage your events, track attendees, and keep everything
            running smoothly in one place.
          </p>

          <div className="auth-highlight">
            <p className="auth-highlight-title">Why log in?</p>
            <ul className="auth-highlight-list">
              <li>✓ Create and publish events in minutes</li>
              <li>✓ Monitor ticket sales in real time</li>
              <li>✓ Send updates and notifications effortlessly</li>
            </ul>
          </div>
        </div>

        {/* Right / bottom side – actual form */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in to your account</h2>
            <p>Use your email and password to continue.</p>
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
              {loading ? "Signing you in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
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
