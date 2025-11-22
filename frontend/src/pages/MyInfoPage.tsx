import { useEffect, useState } from 'react';
import './MyInfoPage.css';

type User = {
  userId: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

type UserPreferences = {
  location?: string;
  categoryId?: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export function MyInfoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    loadUserInfo();
  }, []);

  async function loadUserInfo() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to view your information');
      }

      const res = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please log in to view your information');
        }
        throw new Error(`Failed to load user info (status ${res.status})`);
      }

      const data = await res.json();
      setUser(data.user);
      setFormData({ name: data.user.name, email: data.user.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to update profile');
      }

      const data = await res.json();
      setUser(data.user);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (user) {
      setFormData({ name: user.name, email: user.email });
    }
    setEditing(false);
    setError(null);
  }

  if (loading) {
    return (
      <div className="my-info-page">
        <div className="my-info-page__loading">Loading your information…</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="my-info-page">
        <div className="my-info-page__error">{error}</div>
      </div>
    );
  }

  return (
    <section className="my-info-page">
      <header className="my-info-page__header">
        <h1>My Information</h1>
        <p className="my-info-page__subtitle">Manage your profile and preferences</p>
      </header>

      {error && (
        <div className="my-info-page__error-banner">{error}</div>
      )}

      <div className="info-card">
        <div className="info-card__header">
          <h2>Profile Information</h2>
          {!editing && (
            <button
              type="button"
              className="info-card__edit-btn"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="info-card__form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="form-button form-button--primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="form-button form-button--secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="info-card__content">
            <div className="info-row">
              <span className="info-row__label">User ID</span>
              <span className="info-row__value">#{user?.userId}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Name</span>
              <span className="info-row__value">{user?.name || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Email</span>
              <span className="info-row__value">{user?.email || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Role</span>
              <span className="info-row__value">{user?.role || 'user'}</span>
            </div>
            {user?.createdAt && (
              <div className="info-row">
                <span className="info-row__label">Member Since</span>
                <span className="info-row__value">
                  {new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
                    new Date(user.createdAt)
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}