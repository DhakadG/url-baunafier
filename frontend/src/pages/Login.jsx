import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { C, primaryBtn } from '../constants/theme';
import { API } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthCard, InputField } from '../components/AuthCard';
import { GoogleSignInButton, GitHubSignInButton, DiscordSignInButton } from '../components/OAuthButtons';

export function LoginPage({ toast }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Login failed.'); return; }
      login(d.token, d.user);
      navigate(from, { replace: true });
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  }

  return (
    <AuthCard title="Welcome back.">
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <GitHubSignInButton
          onSuccess={({ token, user }) => { login(token, user); navigate(from, { replace: true }); }}
          onError={msg => setError(msg)}
        />
        <DiscordSignInButton
          onSuccess={({ token, user }) => { login(token, user); navigate(from, { replace: true }); }}
          onError={msg => setError(msg)}
        />
      </div>
      <GoogleSignInButton
        onSuccess={({ token, user }) => { login(token, user); navigate(from, { replace: true }); }}
        onError={msg => setError(msg)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <div style={{ flex: 1, height: 1, background: C.border2 }} />
        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>or</span>
        <div style={{ flex: 1, height: 1, background: C.border2 }} />
      </div>
      <form onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <div style={{ color: C.error, fontFamily: C.mono, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={primaryBtn}>{loading ? 'Logging in…' : 'Login'}</button>
      </form>
      <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginTop: 18, textAlign: 'center' }}>
        No account? <Link to="/signup" style={{ color: C.accent }}>Sign up</Link>
      </p>
    </AuthCard>
  );
}
