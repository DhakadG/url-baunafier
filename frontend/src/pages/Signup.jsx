import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { C, primaryBtn } from '../constants/theme';
import { API } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthCard, InputField } from '../components/AuthCard';
import { GoogleSignInButton, GitHubSignInButton, DiscordSignInButton } from '../components/OAuthButtons';

export function SignupPage({ toast }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Signup failed.'); return; }
      login(d.token, d.user);
      navigate('/dashboard');
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  }

  return (
    <AuthCard title="Create account.">
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <GitHubSignInButton
          onSuccess={({ token, user }) => { login(token, user); navigate('/dashboard'); }}
          onError={msg => setError(msg)}
        />
        <DiscordSignInButton
          onSuccess={({ token, user }) => { login(token, user); navigate('/dashboard'); }}
          onError={msg => setError(msg)}
        />
      </div>
      <GoogleSignInButton
        onSuccess={({ token, user }) => { login(token, user); navigate('/dashboard'); }}
        onError={msg => setError(msg)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <div style={{ flex: 1, height: 1, background: C.border2 }} />
        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>or</span>
        <div style={{ flex: 1, height: 1, background: C.border2 }} />
      </div>
      <form onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <InputField label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
        {error && <div style={{ color: C.error, fontFamily: C.mono, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={primaryBtn}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginTop: 18, textAlign: 'center' }}>
        Have an account? <Link to="/login" style={{ color: C.accent }}>Login</Link>
      </p>
    </AuthCard>
  );
}
