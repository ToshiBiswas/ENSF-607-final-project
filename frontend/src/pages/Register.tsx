import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
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

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    if (/\d/.test(trimmedName)) {
      setError("Name cannot contain numbers");
      return;
    }

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
      await register(trimmedName, trimmedEmail, password);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
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
          <h1 className="auth-title">Create your account ✨</h1>
          <p className="auth-subtitle">
            Join MindPlanner to create events, manage attendees, and track
            everything from one clean dashboard.
          </p>

          <div className="auth-highlight">
            <p className="auth-highlight-title">Why sign up?</p>
            <ul className="auth-highlight-list">
              <li>✓ Publish and share events in minutes</li>
              <li>✓ Keep an eye on ticket sales in real time</li>
              <li>✓ Send updates and notifications with one click</li>
            </ul>
          </div>
        </div>

        {/* Right / bottom side – register form card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create your account</h2>
            <p>Fill in your details to get started.</p>
          </div>

          {error && (
            <div className="auth-error">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Full name</span>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  const lettersOnly = e.target.value.replace(/\d+/g, "");
                  setName(lettersOnly);
                }}
                required
                placeholder="John Doe"
                className="auth-input"
              />
            </label>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="auth-input"
              />
            </label>

            <label className="auth-field">
              <span>Confirm password</span>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter your password"
                className="auth-input"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
