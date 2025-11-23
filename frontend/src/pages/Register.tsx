import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate("/");
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-shell">
        {/* Left side – hero */}
        <section className="register-hero">
          <span className="register-pill">
            <span className="register-pill-dot" />
            Event Planner
          </span>

          <div className="register-hero-header">
            <h1 className="register-title">Create your account ✨</h1>
            <p className="register-subtitle">
              Join MindPlanner to create events, manage attendees, and track
              everything from a single, elegant dashboard.
            </p>
          </div>

          <div className="register-highlight">
            <p className="register-highlight-title">What you get</p>
            <ul className="register-highlight-list">
              <li>Publish and share events in minutes</li>
              <li>Monitor ticket sales in real time</li>
              <li>Send updates and notifications with one click</li>
            </ul>
          </div>
        </section>

        {/* Right side – card */}
        <section className="register-card">
          <header className="register-card-header">
            <h2>Create your account</h2>
            <p>Fill in your details to get started.</p>
          </header>

          {error && <div className="register-error">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="register-button"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="register-footer">
            Already have an account?{" "}
            <Link to="/login" className="register-link">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default Register;
