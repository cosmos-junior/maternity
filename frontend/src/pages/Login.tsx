import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';

// Vite static asset imports
const pregbg = new URL('../../dist/assets/pregbg.jpg', import.meta.url).href;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      login(data);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-split-page">
      {/* ── Left panel: image ── */}
      <div
        className="login-image-panel"
        style={{ backgroundImage: `url(${pregbg})` }}
      >
        <div className="login-image-overlay">
          <div className="login-image-content">
            <div className="login-image-badge">🏥 Itierio Nursing Home</div>
            <h2 className="login-image-headline">
              Compassionate Care<br />
              <span>for Every Mother</span>
            </h2>
            <p className="login-image-sub">
              Tracking maternal health journeys from antenatal to postnatal care
              with precision and empathy.
            </p>
            <div className="login-stats-row">
              <div className="login-stat">
                <span className="login-stat-value">500+</span>
                <span className="login-stat-label">Mothers Served</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">98%</span>
                <span className="login-stat-label">Delivery Success</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">24/7</span>
                <span className="login-stat-label">Care Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          {/* Logo */}
          <div className="login-form-logo">
            <div className="login-form-icon">🏥</div>
            <h1>Materni<span>Track</span></h1>
            <p>Maternity Follow-Up Tracker</p>
            <span className="login-form-org">Itierio Nursing Home</span>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input login-input"
                placeholder="nurse@itierionursing.co.ke"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="login-pass-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn login-submit-btn"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</>
                : 'Sign In to MaterniTrack'
              }
            </button>
          </form>

          <p className="login-footer-note">
            Authorized staff only. Contact your administrator for access.
          </p>

          <div className="login-divider" />
          <div className="login-trust-badges">
            <span>✅ Secure Login</span>
            <span>🏥 HIPAA Aligned</span>
            <span>🛡️ Data Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
