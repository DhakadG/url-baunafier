import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation,
} from 'react-router-dom';

// ─────────────────────────── API base ───────────────────────────────────────

const API = import.meta.env.VITE_API_URL || 'https://go.losthusky.qzz.io';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ─────────────────────────── Design tokens ──────────────────────────────────

const C = {
  bg: '#0a0a0a',
  card: '#111',
  border: '#1a1a1a',
  border2: '#2a2a2a',
  accent: '#c8ff00',
  accentDim: '#8eb000',
  error: '#ff4444',
  text: '#e8e4df',
  muted: '#666',
  display: "'Instrument Serif', Georgia, serif",
  mono: "'DM Mono', 'JetBrains Mono', monospace",
  space: "'Space Grotesk', sans-serif",
};

// ─────────────────────────── SVG Icons ─────────────────────────────────────

const Ic = {
  qr: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><path d="M17 20h4m0 0v-4m0 4v0"/></svg>,
  copy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  chart: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  lock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  userX: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>,
  userCheck: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  google: <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
};

function IconBtn({ icon, onClick, title, hoverColor, disabled: dis, style: extraStyle }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={dis} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'none', border: `1px solid ${hov ? (hoverColor || C.accent) : C.border2}`, borderRadius: 6,
        color: hov ? (hoverColor || C.accent) : C.muted, cursor: dis ? 'not-allowed' : 'pointer',
        padding: '5px 7px', lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color .15s, border-color .15s', ...extraStyle,
      }}>
      {icon}
    </button>
  );
}

function ToggleSwitch({ enabled, onToggle, disabled: dis }) {
  return (
    <button onClick={onToggle} disabled={dis}
      title={enabled ? 'Disable link (pauses redirects)' : 'Enable link (resumes redirects)'}
      style={{ background: 'none', border: 'none', cursor: dis ? 'not-allowed' : 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 38, height: 22, borderRadius: 11, background: enabled ? C.accent : C.border2, position: 'relative', transition: 'background .22s', flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: enabled ? '#000' : '#555', position: 'absolute', top: 3, left: enabled ? 19 : 3, transition: 'left .22s, background .22s' }} />
      </div>
      <span style={{ fontFamily: C.mono, fontSize: 11, color: enabled ? C.accent : C.muted, minWidth: 22 }}>{enabled ? 'live' : 'off'}</span>
    </button>
  );
}

// ─────────────────────────── Auth context ───────────────────────────────────

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const login = useCallback((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try { await fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignore */ }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, [token]);

  // Validate existing session once on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => { localStorage.setItem('user', JSON.stringify(u)); setUser(u); })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(null); setUser(null); });
  }, []); // eslint-disable-line

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}

function useAuth() { return useContext(AuthContext); }

// ─────────────────────────── Route guards ───────────────────────────────────

function PrivateRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// ─────────────────────────── Toast ──────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastStack({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? C.error : t.type === 'success' ? C.accent : C.card,
          color: t.type === 'success' ? '#000' : C.text,
          padding: '10px 18px', borderRadius: 8, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,.5)',
          fontFamily: C.mono, maxWidth: 320,
          animation: 'slideIn .2s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─────────────────────────── Logo ───────────────────────────────────────────

const BRAND_NAMES = ['Baunafier', 'Snipper', 'Shortner', 'Chhota.link', 'Kattu', 'Snikr', 'URLess', 'Linkbender'];

function Logo({ size = 'lg' }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % BRAND_NAMES.length), 2800);
    return () => clearInterval(id);
  }, []);

  const isLg = size === 'lg';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: isLg ? 10 : 6, userSelect: 'none' }}>
      <span style={{
        fontFamily: C.space, fontWeight: 800,
        fontSize: isLg ? 48 : 22,
        color: C.text, letterSpacing: '-0.03em', lineHeight: 1,
      }}>URL</span>
      <div style={{ overflow: 'hidden', display: 'inline-block', lineHeight: 1 }}>
        <span key={idx} style={{
          fontFamily: C.display, fontStyle: 'italic',
          fontSize: isLg ? 44 : 20,
          color: C.accent, lineHeight: 1,
          display: 'inline-block',
          animation: 'nameSlideIn .45s cubic-bezier(.22,1,.36,1) both',
        }}>{BRAND_NAMES[idx]}</span>
      </div>
    </div>
  );
}

// ─────────────────────────── QR Code ────────────────────────────────────────

function QRButton({ url }) {
  const [open, setOpen] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=111111&color=c8ff00&margin=10`;
  return (
    <>
      <button onClick={() => setOpen(true)} title="Show QR Code" style={{
        background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6,
        color: C.muted, cursor: 'pointer', padding: '5px 7px', lineHeight: 0,
        display: 'flex', alignItems: 'center', transition: 'color .15s, border-color .15s',
      }} onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
         onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border2; }}>
        {Ic.qr}
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.card, border: `1px solid ${C.border2}`, borderRadius: 14,
            padding: 28, textAlign: 'center',
          }}>
            <img src={qrUrl} alt="QR code" width={200} height={200} style={{ borderRadius: 8, display: 'block', marginBottom: 14 }} />
            <div style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, wordBreak: 'break-all', maxWidth: 200 }}>{url}</div>
            <a href={qrUrl} download="qr.png" style={{
              display: 'inline-block', marginTop: 14, padding: '8px 20px',
              background: C.accent, color: '#000', borderRadius: 7, fontSize: 13,
              fontFamily: C.mono, textDecoration: 'none', fontWeight: 600,
            }}>Download PNG</a>
            <button onClick={() => setOpen(false)} style={{
              display: 'block', margin: '12px auto 0', background: 'none', border: 'none',
              color: C.muted, cursor: 'pointer', fontFamily: C.mono, fontSize: 12,
            }}>✕ close</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────── Expiry picker ──────────────────────────────────

const QUICK_CHIPS = [
  { label: 'None', minutes: null },
  { label: '5 min', minutes: 5 },
  { label: '1 hour', minutes: 60 },
  { label: '24 hours', minutes: 1440 },
  { label: '7 days', minutes: 10080 },
  { label: '30 days', minutes: 43200 },
];

function Spinner({ value, onChange, min = 0, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button onClick={() => onChange(value + 1)} style={spinBtn}>▲</button>
      <div style={{ fontFamily: C.mono, fontSize: 22, color: C.text, width: 44, textAlign: 'center', lineHeight: 1.2 }}>
        {String(value).padStart(2, '0')}
      </div>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={spinBtn}>▼</button>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const spinBtn = {
  background: 'none', border: `1px solid ${C.border2}`, color: C.muted, cursor: 'pointer',
  borderRadius: 5, padding: '2px 10px', fontSize: 12, lineHeight: 1.8,
  transition: 'color .15s, border-color .15s',
};

function ExpiryPicker({ value, onChange }) {
  // value = minutes (number | null)
  const [customOpen, setCustomOpen] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // When custom fields change, compute total minutes
  useEffect(() => {
    if (!customOpen) return;
    const total = days * 1440 + hours * 60 + minutes;
    onChange(total > 0 ? total : null);
  }, [days, hours, minutes, customOpen]); // eslint-disable-line

  const isQuick = QUICK_CHIPS.some(c => c.minutes === value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {QUICK_CHIPS.map(c => {
          const active = !customOpen && c.minutes === value;
          return (
            <button key={c.label} onClick={() => { setCustomOpen(false); onChange(c.minutes); }} style={{
              background: active ? C.accent : 'none', color: active ? '#000' : C.muted,
              border: `1px solid ${active ? C.accent : C.border2}`,
              borderRadius: 6, padding: '5px 12px', fontFamily: C.mono, fontSize: 12,
              cursor: 'pointer', transition: 'all .15s',
            }}>{c.label}</button>
          );
        })}
        <button onClick={() => { setCustomOpen(o => !o); if (!customOpen) onChange(null); }} style={{
          background: customOpen ? C.accent : 'none', color: customOpen ? '#000' : C.muted,
          border: `1px solid ${customOpen ? C.accent : C.border2}`,
          borderRadius: 6, padding: '5px 12px', fontFamily: C.mono, fontSize: 12,
          cursor: 'pointer', transition: 'all .15s',
        }}>Custom ✦</button>
      </div>

      {customOpen && (
        <div style={{
          display: 'flex', gap: 24, padding: '16px 20px',
          background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10,
          width: 'fit-content', alignItems: 'flex-start',
        }}>
          <Spinner value={days} onChange={setDays} label="days" />
          <Spinner value={hours} onChange={v => setHours(Math.min(23, v))} label="hours" />
          <Spinner value={minutes} onChange={v => setMinutes(Math.min(59, v))} label="min" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Analytics charts ───────────────────────────────

function HourlyBarChart({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', gap: 3, height: 52, alignItems: 'flex-end', paddingTop: 4 }}>
      {data.map((v, i) => (
        <div key={i} title={`${i}:00 — ${v} click${v !== 1 ? 's' : ''}`} style={{
          flex: 1, background: v ? C.accent : C.border, borderRadius: 2,
          height: `${Math.max(3, (v / max) * 100)}%`,
          opacity: v > 0 ? 1 : 0.25, transition: 'height .3s, opacity .3s',
        }} />
      ))}
    </div>
  );
}

function Pct({ obj, total }) {
  if (!obj || !total) return <span style={{ color: C.muted, fontFamily: C.mono, fontSize: 12 }}>—</span>;
  const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
      {sorted.map(([k, v]) => (
        <span key={k} style={{ fontFamily: C.mono, fontSize: 12, color: C.muted }}>
          <span style={{ color: C.text }}>{k}</span> {((v / total) * 100).toFixed(0)}%
        </span>
      ))}
    </div>
  );
}

function BreakdownRow({ label, obj, total }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <Pct obj={obj} total={total} />
    </div>
  );
}

function AnalyticsPanel({ code, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`${API}/api/stats/${code}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code, token]);

  if (loading) return <div style={{ padding: '12px 0', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading analytics…</div>;
  if (!data?.analytics) return null;

  const { analytics, clicks } = data;
  return (
    <div style={{ padding: '14px 0 6px' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Clicks today by hour</div>
        <HourlyBarChart data={analytics.clicks_today_by_hour || new Array(24).fill(0)} />
        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          {[['24h', analytics.clicks_last_24h], ['7d', analytics.clicks_last_7d], ['total', clicks]].map(([l, v]) => (
            <span key={l} style={{ fontFamily: C.mono, fontSize: 12 }}>
              <span style={{ color: C.muted }}>{l} </span><span style={{ color: C.accent }}>{v ?? 0}</span>
            </span>
          ))}
        </div>
      </div>
      <BreakdownRow label="Country" obj={analytics.clicks_by_country} total={clicks} />
      <BreakdownRow label="Device" obj={analytics.clicks_by_device} total={clicks} />
      <BreakdownRow label="Browser" obj={analytics.clicks_by_browser} total={clicks} />
      <BreakdownRow label="OS" obj={analytics.clicks_by_os} total={clicks} />
      <BreakdownRow label="Referrer" obj={analytics.clicks_by_referrer} total={clicks} />
    </div>
  );
}

// ─────────────────────────── Link row ───────────────────────────────────────

function LinkRow({ entry, token, onRefresh, toast }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shortUrl = entry.short_url || `https://go.losthusky.qzz.io/${entry.code}`;

  async function toggleEnabled() {
    setToggling(true);
    try {
      await fetch(`${API}/api/links/${entry.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !entry.enabled }),
      });
      toast(`Link ${entry.enabled ? 'disabled' : 'enabled'}.`, 'success');
      onRefresh();
    } catch { toast('Failed to toggle.', 'error'); }
    finally { setToggling(false); }
  }

  async function deleteLink() {
    if (!confirm(`Delete /${entry.code}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`${API}/api/links/${entry.code}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast('Link deleted.', 'success');
      onRefresh();
    } catch { toast('Failed to delete.', 'error'); }
    finally { setDeleting(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(shortUrl).then(() => toast('Copied!', 'success')).catch(() => toast('Copy failed.', 'error'));
  }

  const isExpired = entry.expires_at && new Date(entry.expires_at) < new Date();
  const statusColor = !entry.enabled ? C.error : isExpired ? '#ff9900' : C.accent;
  const statusLabel = !entry.enabled ? 'disabled' : isExpired ? 'expired' : 'active';

  return (
    <>
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 64px 110px 80px 200px',
        gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}`,
        alignItems: 'center', fontSize: 13,
      }}>
        {/* Alias */}
        <div style={{ overflow: 'hidden' }}>
          <a href={shortUrl} target="_blank" rel="noreferrer" style={{ fontFamily: C.mono, color: C.accent, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>/{entry.code}</a>
        </div>
        {/* Original URL */}
        <div style={{ overflow: 'hidden', fontFamily: C.mono, fontSize: 11, color: C.muted, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={entry.original_url}>
          {entry.original_url}
        </div>
        {/* Clicks */}
        <div style={{ fontFamily: C.mono, color: C.text, textAlign: 'center' }}>{entry.clicks ?? 0}</div>
        {/* Status */}
        <div style={{ fontFamily: C.mono, fontSize: 11, color: statusColor, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          {statusLabel}
        </div>
        {/* Created */}
        <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
          {new Date(entry.created_at).toLocaleDateString()}
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <QRButton url={shortUrl} />
          <IconBtn icon={Ic.copy} onClick={copyLink} title="Copy link to clipboard" />
          <IconBtn icon={Ic.chart} onClick={() => setExpanded(e => !e)} title="View analytics" hoverColor={C.accent} style={{ background: expanded ? `${C.accent}22` : 'none', borderColor: expanded ? C.accent : C.border2, color: expanded ? C.accent : C.muted }} />
          <ToggleSwitch enabled={entry.enabled} onToggle={toggleEnabled} disabled={toggling} />
          <IconBtn icon={Ic.trash} onClick={deleteLink} title="Delete link permanently" hoverColor={C.error} disabled={deleting} />
        </div>
      </div>
      {expanded && (
        <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
          <AnalyticsPanel code={entry.code} token={token} />
        </div>
      )}
    </>
  );
}

const actionBtn = {
  background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6,
  color: C.muted, cursor: 'pointer', padding: '4px 8px', fontSize: 13,
  fontFamily: C.mono, transition: 'color .15s, border-color .15s',
};

// ─────────────────────────── Shared nav ─────────────────────────────────────

function NavBar({ toast }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 60,
    }}>
      <Link to={user ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
        <Logo size="sm" />
      </Link>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {user?.role === 'admin' && (
          <Link to="/v1/admin" style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, textDecoration: 'none' }}>admin</Link>
        )}
        {user && (
          <>
            <span style={{ fontFamily: C.mono, fontSize: 12, color: C.muted }}>{user.email}</span>
            <button onClick={handleLogout} style={{
              background: 'none', border: `1px solid ${C.border2}`, borderRadius: 7,
              color: C.muted, cursor: 'pointer', fontFamily: C.mono, fontSize: 12,
              padding: '5px 14px', transition: 'color .15s',
            }}>logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────── Landing page ───────────────────────────────────

function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        padding: '0 32px', height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`,
      }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, textDecoration: 'none', padding: '6px 16px', border: `1px solid ${C.border2}`, borderRadius: 7 }}>login</Link>
          <Link to="/signup" style={{ fontFamily: C.mono, fontSize: 13, color: '#000', background: C.accent, textDecoration: 'none', padding: '6px 16px', borderRadius: 7, fontWeight: 600 }}>sign up</Link>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: 48 }}>
          <Logo size="lg" />
        </div>
        <p style={{ fontFamily: C.space, fontSize: 20, color: C.muted, maxWidth: 480, lineHeight: 1.7, marginBottom: 48 }}>
          Shorten URLs. Track every click. Get analytics on countries, devices, referrers — and more.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/signup" style={{ fontFamily: C.mono, fontSize: 15, color: '#000', background: C.accent, textDecoration: 'none', padding: '12px 32px', borderRadius: 9, fontWeight: 700 }}>Get started — free</Link>
          <Link to="/login" style={{ fontFamily: C.mono, fontSize: 15, color: C.text, border: `1px solid ${C.border2}`, textDecoration: 'none', padding: '12px 32px', borderRadius: 9 }}>Already have an account</Link>
        </div>

        <div style={{ display: 'flex', gap: 48, marginTop: 96, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Click analytics', 'QR codes', 'Expiry control', 'Custom aliases', 'Link management', 'Admin dashboard'].map(f => (
            <div key={f} style={{ fontFamily: C.mono, fontSize: 13, color: C.muted }}>✦ {f}</div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────── Google Sign-In ────────────────────────────────

function GoogleSignInButton({ onSuccess, onError }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const tryInit = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const r = await fetch(`${API}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });
            const d = await r.json();
            if (!r.ok) { onError(d.error || 'Google sign-in failed'); return; }
            onSuccess(d);
          } catch { onError('Network error. Try again.'); }
        },
      });
      if (containerRef.current) {
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black', size: 'large', width: containerRef.current.offsetWidth || 358,
          text: 'continue_with', shape: 'rectangular',
        });
      }
      window.google.accounts.id.prompt();
    };
    if (window.google) { tryInit(); } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi"]');
      if (script) script.addEventListener('load', tryInit);
    }
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
      }}>
        <div style={{ flex: 1, height: 1, background: C.border2 }} />
        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>or</span>
        <div style={{ flex: 1, height: 1, background: C.border2 }} />
      </div>
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}

// ─────────────────────────── Auth pages ─────────────────────────────────────

function AuthCard({ title, children }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Link to="/" style={{ textDecoration: 'none', marginBottom: 36 }}><Logo size="sm" /></Link>
      <div style={{ width: '100%', maxWidth: 420, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '36px 32px' }}>
        <h2 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 28, color: C.text, marginBottom: 28 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, ...props }) {
  const isPassword = props.type === 'password';
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input {...props} type={isPassword ? (show ? 'text' : 'password') : props.type} style={{
          width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8,
          padding: isPassword ? '10px 44px 10px 14px' : '10px 14px', color: C.text, fontFamily: C.mono, fontSize: 14,
          outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
          ...(props.style || {}),
        }} onFocus={e => e.currentTarget.style.borderColor = C.accent}
           onBlur={e => e.currentTarget.style.borderColor = C.border2} />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0,
            display: 'flex', alignItems: 'center', fontSize: 16, lineHeight: 1,
          }} tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </label>
  );
}

function LoginPage({ toast }) {
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
      <form onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <div style={{ color: C.error, fontFamily: C.mono, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={primaryBtn}>{loading ? 'Logging in…' : 'Login'}</button>
      </form>
      <GoogleSignInButton
        onSuccess={({ token, user }) => { login(token, user); navigate(from, { replace: true }); }}
        onError={msg => setError(msg)}
      />
      <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginTop: 18, textAlign: 'center' }}>
        No account? <Link to="/signup" style={{ color: C.accent }}>Sign up</Link>
      </p>
    </AuthCard>
  );
}

function SignupPage({ toast }) {
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
      <form onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <InputField label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
        {error && <div style={{ color: C.error, fontFamily: C.mono, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={primaryBtn}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <GoogleSignInButton
        onSuccess={({ token, user }) => { login(token, user); navigate('/dashboard'); }}
        onError={msg => setError(msg)}
      />
      <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginTop: 18, textAlign: 'center' }}>
        Have an account? <Link to="/login" style={{ color: C.accent }}>Login</Link>
      </p>
    </AuthCard>
  );
}

const primaryBtn = {
  width: '100%', background: C.accent, color: '#000', border: 'none', borderRadius: 8,
  padding: '11px 0', fontFamily: C.mono, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  transition: 'opacity .15s',
};

// ─────────────────────────── Footer ─────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, background: C.bg, padding: '56px 40px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* 30% — app icon */}
        <div style={{ flex: '0 0 28%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 120 }}>
          <svg width="96" height="96" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <path d="M406.718 0.0709539C407.168 0.0517632 407.618 0.0372891 408.068 0.0278621C467.404 -1.24984 512.384 41.5499 511.843 101.008C511.625 124.679 511.857 148.719 511.86 172.42L511.87 313.91L511.883 380.276C511.89 396.942 512.764 416.503 509.623 432.66C506.106 451.308 497.249 468.523 484.132 482.206C470.588 496.222 453.125 505.797 434.043 509.665C419.364 512.722 405.401 511.867 390.565 511.891L333.073 511.79H189.165C161.521 511.796 132.981 511.524 105.408 511.985C77.3282 512.355 53.442 505.985 32.0653 486.673C11.2391 467.86 1.16795 441.555 0.18881 413.94C-0.0705019 406.621 0.110212 398.541 0.119617 391.127L0.226768 346.598L0.222063 209.994L0.186462 132.213C0.171347 115.753 -0.840037 94.4489 2.00903 78.7395C5.26117 61.3469 13.3018 45.2129 25.2228 32.1612C38.4964 17.4446 56.0207 7.2466 75.3525 2.98929C92.0589 -0.729333 106.955 0.257819 123.812 0.272296L171.721 0.294181L325.693 0.295527L376.78 0.268248C386.537 0.259494 397.048 0.460155 406.718 0.0709539Z" fill="#070707"/>
            <path d="M316.796 174.538C328.945 173.134 338.714 181.619 337.296 194.32C336.696 199.724 332.402 205.47 329.306 209.877C326.138 214.304 322.912 218.688 319.628 223.027C310.018 235.934 310.401 241.732 323.009 252.781C330.424 259.277 338.287 265.52 345.879 271.821C369.866 291.732 393.694 312.315 413.175 336.798C424.467 350.969 430.301 369.108 427.733 387.207C425.342 404.3 416.202 419.723 402.357 430.031C388.443 440.415 371.776 444.317 354.661 441.811C345.159 440.4 336.052 437.04 327.907 431.944C316.821 424.862 307.97 415.346 299.073 405.845C274.026 379.09 254.748 348.987 232.987 319.777L225.473 309.769C229.865 302.94 234.196 296.068 238.465 289.16C250.303 292.571 254.249 300.875 261.092 310.312C279.914 336.274 298.429 362.276 320.152 385.955C333.958 401.002 348.226 417.238 370.987 413.147C379.986 411.592 387.958 406.423 393.051 398.846C399.984 388.661 400.874 375.531 395.966 364.294C387.108 344.014 340.873 305.241 322.492 289.609C312.549 281.149 301.391 272.768 293.387 262.409C288.808 256.485 285.347 249.403 283.951 242.025C280.102 221.714 296.725 207.1 307.12 191.806L302.574 195.49C300.888 193.509 298.639 191.248 296.827 189.326C302.451 181.964 307.428 176.51 316.796 174.538Z" fill="#A4F670"/>
            <path d="M139.23 70.0706C143.122 69.4764 150.261 69.6956 154.182 70.0992C178.701 72.6242 194.786 88.0111 211.025 104.875C238.942 133.865 261.46 167.009 286.435 198.464C281.212 206.248 276.109 214.108 271.118 222.041C261.724 215.158 258.769 210.04 251.876 200.769C246.003 192.828 240.041 184.953 233.992 177.145C216.661 154.727 198.072 131.781 177.439 112.323C168.333 103.735 157.557 97.9612 144.69 98.6217C135.715 99.1117 127.303 103.149 121.306 109.845C111.325 120.959 109.271 138.731 117.353 151.13C128.468 168.182 146.952 184.649 162.013 198.135C172.63 208.012 184.388 217.237 195.405 226.686C202.695 232.939 211.617 239.925 217.594 247.384C221.639 252.35 224.623 258.09 226.365 264.253C232.575 286.982 215.044 300.798 204.438 319.125C206.043 317.291 207.055 315.595 209.376 315.139C211.867 315.617 213.544 318.825 215.147 321.071C210.866 328.117 203.312 335.788 194.934 337.47C190.452 338.371 185.796 337.401 182.044 334.79C178.01 332.041 175.277 328.001 174.495 323.162C173.977 320.015 174.208 316.792 175.171 313.75C177.754 305.609 188.487 292.534 193.636 285.021C203.095 271.216 196.762 265.523 185.816 256.267C162.56 236.601 138.44 217.727 117.134 195.889C108.86 187.407 99.9339 178.048 93.7436 167.939C89.0977 160.404 85.9564 152.041 84.4941 143.31C81.6516 126.549 85.692 109.35 95.7004 95.6084C106.485 80.7998 121.408 72.9059 139.23 70.0706Z" fill="#A4F670"/>
            <path d="M165.509 254.756C172.094 259.787 180.075 267.057 186.317 272.616C166.008 295.706 145.311 318.75 125.555 342.317C116.109 353.587 108.356 364.442 110.029 379.843C111.107 389.377 116.001 398.068 123.595 403.935C131.163 409.874 140.978 412.344 150.485 411.179C156.909 410.355 163.027 407.949 168.288 404.173C176.977 397.945 188.472 384.027 195.428 375.651C206.834 361.791 217.999 347.735 228.918 333.492C234.675 340.556 241.385 350.397 246.699 357.946L241.413 364.623C228.564 380.953 215.941 397.355 201.918 412.731C187.557 428.479 169.264 439.586 147.368 440.14C130.183 440.476 113.563 433.998 101.139 422.12C88.5605 409.971 81.3716 393.286 81.177 375.799C80.6923 346.875 99.8105 326.819 117.632 306.474C133.185 288.863 149.149 271.618 165.509 254.756Z" fill="#A4F670"/>
            <path d="M364.638 73.3722C381.822 73.1212 398.409 79.6551 410.808 91.5565C423.46 103.564 430.704 120.187 430.885 137.63C431.439 169.137 407.95 191.549 388.206 213.188C374.57 228.182 360.696 242.961 346.593 257.515C340.561 251.663 331.761 244.918 325.109 238.88C345.53 217.261 365.521 195.236 385.063 172.82C386.878 170.74 388.654 168.627 390.39 166.483C398.348 156.497 403.607 146.639 402.012 133.464C400.898 124.101 396.094 115.568 388.665 109.761C380.943 103.799 371.181 101.116 361.499 102.292C355.292 103.09 349.371 105.386 344.25 108.981C335.761 115.001 321.789 131.355 314.653 139.831C304.703 151.649 293.165 164.983 283.728 177.216C278.111 169.317 271.438 160.815 265.586 152.997C270.035 148.008 274.682 142.017 279.005 136.785C286.557 127.53 294.315 118.447 302.279 109.543C320.559 89.0406 335.757 75.028 364.638 73.3722Z" fill="#A4F670"/>
            <path d="M286.869 284.136C291.683 283.793 296.545 284.834 299.995 288.408C309.258 297.996 318.825 307.364 327.964 317.053C329.346 318.515 330.891 321.318 331.542 323.115C333.108 327.394 332.797 332.132 330.681 336.165C328.174 341.044 324.38 342.77 319.519 344.263C313.848 344.972 309.016 343.428 305.088 339.312C295.908 329.687 286.555 319.824 277.559 310.062C271.259 303.222 272.575 292.18 280.174 287.019C282.449 285.471 284.269 284.881 286.869 284.136Z" fill="#A4F670"/>
            <path d="M195.047 169.49C207.738 167.932 213.882 180.043 222.144 187.602C227.148 192.182 232.127 197.694 236.791 202.568C241.281 207.259 242.695 215.036 239.666 220.811C237.154 225.847 233.768 227.535 228.764 229.255C216.129 231.286 209.224 218.456 200.953 210.966C196.416 205.921 190.638 201.388 186.416 196.131C177.752 185.341 182.685 173.05 195.047 169.49Z" fill="#A4F670"/>
          </svg>
        </div>
        {/* 70% — wordmark + links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 200 }}>
          <Logo size="lg" />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/privacy" style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}>Privacy Policy</Link>
            <Link to="/terms" style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}>Terms of Service</Link>
            <a href="https://github.com/DhakadG/url-baunafier" target="_blank" rel="noreferrer"
              style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}>GitHub ↗</a>
          </div>
          <p style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>© {new Date().getFullYear()} URL Baunafier · Built on Cloudflare Workers &amp; KV · All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────── Dashboard page ─────────────────────────────────

function DashboardPage({ toast }) {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(null);
  const [shortening, setShortening] = useState(false);
  const [result, setResult] = useState(null);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLinks = useCallback(async () => {
    setLoadingLinks(true);
    try {
      const r = await fetch(`${API}/api/links`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setLinks(Array.isArray(d) ? d : []);
    } catch { setLinks([]); }
    finally { setLoadingLinks(false); }
  }, [token]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function handleShorten(e) {
    e.preventDefault();
    if (!url.trim()) { toast('Enter a URL.', 'error'); return; }
    setShortening(true);
    try {
      const body = { url: url.trim() };
      if (alias.trim()) body.alias = alias.trim();
      if (expiryMinutes) body.expires_minutes = expiryMinutes;
      const r = await fetch(`${API}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { toast(d.error || 'Could not shorten.', 'error'); return; }
      setResult(d);
      toast('Link created!', 'success');
      setUrl(''); setAlias(''); setExpiryMinutes(null);
      fetchLinks();
    } catch { toast('Network error.', 'error'); }
    finally { setShortening(false); }
  }

  function copyResult() {
    if (result?.short_url) navigator.clipboard.writeText(result.short_url)
      .then(() => toast('Copied!', 'success'))
      .catch(() => toast('Copy failed.', 'error'));
  }

  const filteredLinks = links.filter(l =>
    !search || l.code.includes(search) || l.original_url.includes(search)
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <NavBar toast={toast} />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Shorten form */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 28, color: C.text, marginBottom: 24 }}>Shorten a URL</h2>
          <form onSubmit={handleShorten}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
                style={{ ...inputStyle, flex: '1 1 280px' }}
                onFocus={e => e.currentTarget.style.borderColor = C.accent}
                onBlur={e => e.currentTarget.style.borderColor = C.border2}
              />
              <input
                value={alias} onChange={e => setAlias(e.target.value)}
                placeholder="custom-alias (optional)"
                style={{ ...inputStyle, flex: '0 1 200px' }}
                onFocus={e => e.currentTarget.style.borderColor = C.accent}
                onBlur={e => e.currentTarget.style.borderColor = C.border2}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expiry</div>
              <ExpiryPicker value={expiryMinutes} onChange={setExpiryMinutes} />
            </div>

            <button type="submit" disabled={shortening} style={{
              ...primaryBtn, width: 'auto', padding: '10px 28px',
            }}>{shortening ? 'Shortening…' : 'Shorten ✦'}</button>
          </form>

          {result && (
            <div style={{
              marginTop: 20, background: C.card, border: `1px solid ${C.border2}`,
              borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginBottom: 4 }}>Your short link</div>
                <a href={result.short_url} target="_blank" rel="noreferrer" style={{ fontFamily: C.mono, fontSize: 18, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                  {result.short_url}
                </a>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <QRButton url={result.short_url} />
                <button onClick={copyResult} style={{ ...actionBtn, color: C.accent, borderColor: C.accent }}>Copy</button>
              </div>
            </div>
          )}
        </section>

        {/* Links table */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 24, color: C.text }}>Your links</h2>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter links…"
              style={{ ...inputStyle, width: 200, fontSize: 12 }}
              onFocus={e => e.currentTarget.style.borderColor = C.accent}
              onBlur={e => e.currentTarget.style.borderColor = C.border2}
            />
          </div>

          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 64px 110px 80px 200px',
            gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border2}`,
            fontFamily: C.mono, fontSize: 10, color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <span>Alias</span><span>Original URL</span><span style={{ textAlign: 'center' }}>Clicks</span>
            <span>Status</span><span>Created</span><span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {loadingLinks ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading links…</div>
          ) : filteredLinks.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
              {search ? 'No links match your filter.' : 'No links yet. Create one above!'}
            </div>
          ) : (
            filteredLinks.map(entry => (
              <LinkRow key={entry.code} entry={entry} token={token} onRefresh={fetchLinks} toast={toast} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

const inputStyle = {
  background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8,
  padding: '10px 14px', color: C.text, fontFamily: C.mono, fontSize: 14,
  outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box', width: '100%',
};

// ─────────────────────────── Admin page ─────────────────────────────────────

function AdminPage({ toast }) {
  const { token } = useAuth();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setStats(d);
  }, [token]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setUsers(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [token]);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/admin/links`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setLinks(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchStats();
    if (tab === 'users') fetchUsers();
    if (tab === 'links') fetchLinks();
  }, [tab]); // eslint-disable-line

  async function toggleUser(user) {
    await fetch(`${API}/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ disabled: !user.disabled }),
    });
    toast(`User ${user.disabled ? 'enabled' : 'disabled'}.`, 'success');
    fetchUsers();
  }

  async function promoteUser(user) {
    await fetch(`${API}/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: user.role === 'admin' ? 'user' : 'admin' }),
    });
    toast(`Role updated.`, 'success');
    fetchUsers();
  }

  async function deleteUser(user) {
    if (!confirm(`Delete user ${user.email} and all their links?`)) return;
    await fetch(`${API}/api/admin/users/${user.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast('User deleted.', 'success');
    fetchUsers();
  }

  async function adminToggleLink(link) {
    await fetch(`${API}/api/links/${link.code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enabled: !link.enabled }),
    });
    toast(`Link ${link.enabled ? 'disabled' : 'enabled'}.`, 'success');
    fetchLinks();
  }

  async function adminDeleteLink(link) {
    if (!confirm(`Delete /${link.code}?`)) return;
    await fetch(`${API}/api/links/${link.code}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast('Link deleted.', 'success');
    fetchLinks();
  }

  const tabStyle = active => ({
    background: active ? C.accent : 'none',
    color: active ? '#000' : C.muted,
    border: `1px solid ${active ? C.accent : C.border2}`,
    borderRadius: 7, padding: '6px 18px', fontFamily: C.mono, fontSize: 12,
    cursor: 'pointer', fontWeight: active ? 700 : 400,
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <NavBar toast={toast} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 36, marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 32 }}>v1 — full access</p>

        {stats && (
          <div style={{ display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
            {[['Total users', stats.total_users], ['Total links', stats.total_links], ['Total clicks', stats.total_clicks]].map(([l, v]) => (
              <div key={l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 28px', flex: '1 1 150px' }}>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{l}</div>
                <div style={{ fontFamily: C.space, fontWeight: 800, fontSize: 36, color: C.accent }}>{v ?? 0}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {['stats', 'users', 'links'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>{t}</button>
          ))}
        </div>

        {tab === 'stats' && (
          <div style={{ color: C.muted, fontFamily: C.mono, fontSize: 14 }}>
            Overview stats shown above. Switch to Users or Links tabs for detailed management.
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 100px 90px 120px', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border2}`, fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Email</span><span>Role</span><span style={{textAlign:'center'}}>Links</span><span>Status</span><span>Joined</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading…</div>
            ) : users.map(u => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 100px 90px 120px', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'center', fontSize: 13 }}>
                <div>
                  <div style={{ fontFamily: C.mono, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{u.email}</div>
                  <div style={{ fontFamily: C.mono, color: C.muted, fontSize: 11, marginTop: 2 }}>ID: {u.id}</div>
                </div>
                <span style={{ fontFamily: C.mono, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: u.role === 'admin' ? C.accent : C.muted }}>{u.role === 'admin' ? Ic.shield : null}</span>
                  <span style={{ color: u.role === 'admin' ? C.accent : C.muted }}>{u.role}</span>
                </span>
                <span style={{ fontFamily: C.mono, color: C.muted, fontSize: 12, textAlign: 'center' }}>{u.link_count ?? 0}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.disabled ? C.error : C.accent, flexShrink: 0 }} />
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: u.disabled ? C.error : C.accent }}>{u.disabled ? 'Suspended' : 'Active'}</span>
                </div>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>{new Date(u.created_at).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <IconBtn icon={u.role === 'admin' ? Ic.userX : Ic.shield} onClick={() => promoteUser(u)} title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'} hoverColor={u.role === 'admin' ? '#ff9900' : C.accent} />
                  <IconBtn icon={u.disabled ? Ic.userCheck : Ic.userX} onClick={() => toggleUser(u)} title={u.disabled ? 'Re-enable account' : 'Suspend account'} hoverColor={u.disabled ? C.accent : C.error} />
                  <IconBtn icon={Ic.trash} onClick={() => deleteUser(u)} title="Delete user and all their links" hoverColor={C.error} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'links' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 180px 60px 120px 80px 120px', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border2}`, fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Alias</span><span>Original URL</span><span>Created by</span><span style={{textAlign:'center'}}>Clicks</span><span>Status</span><span>Date</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading…</div>
            ) : links.map(l => {
              const isExpired = l.expires_at && new Date(l.expires_at) < new Date();
              const statusColor = !l.enabled ? C.error : isExpired ? '#ff9900' : C.accent;
              const statusLabel = !l.enabled ? 'Disabled' : isExpired ? 'Expired' : 'Live';
              return (
              <div key={l.code} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 180px 60px 120px 80px 120px', gap: 10, padding: '14px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'center', fontSize: 13 }}>
                <div>
                  <a href={l.short_url} target="_blank" rel="noreferrer" style={{ fontFamily: C.mono, color: C.accent, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>/{l.code}</a>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontFamily: C.mono, color: C.muted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.original_url}>{l.original_url}</div>
                  {l.expires_at && <div style={{ fontFamily: C.mono, fontSize: 10, color: isExpired ? '#ff9900' : C.muted, marginTop: 2 }}>expires {new Date(l.expires_at).toLocaleDateString()}</div>}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontFamily: C.mono, fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.owner_email}>{l.owner_email}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>ID: {l.userId || '—'}</div>
                </div>
                <span style={{ fontFamily: C.mono, color: C.accent, textAlign: 'center', fontWeight: 600 }}>{l.clicks ?? 0}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: statusColor }}>{statusLabel}</span>
                </div>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>{new Date(l.created_at).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <QRButton url={l.short_url} />
                  <ToggleSwitch enabled={l.enabled} onToggle={() => adminToggleLink(l)} />
                  <IconBtn icon={Ic.trash} onClick={() => adminDeleteLink(l)} title="Delete link permanently" hoverColor={C.error} />
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────── 404 page ───────────────────────────────────────

// ─────────────────────────── Privacy page ───────────────────────────────────

function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <Link to="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <Link to="/" style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, textDecoration: 'none' }}>← back</Link>
      </nav>
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '64px 24px 80px', width: '100%' }}>
        <h1 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 48, color: C.text, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 48 }}>Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {[
          { title: '1. Who we are', body: 'URL Baunafier is a personal URL-shortening service operated by Dhakad Kumawat (dhakad.kumawat18@gmail.com) and accessible at snip.losthusky.qzz.io. By using the service you agree to this policy.' },
          { title: '2. Information we collect', body: 'Account data: your email address and a salted PBKDF2 hash of your password (we never see your plaintext password). Link data: the original URL you submit and the alias/code we assign. Analytics: for every click on a shortened link we store the country, device type, browser family, operating system, and HTTP referrer. No cookies or fingerprints are used for tracking visitors; analytics are associated with links, not visitors.' },
          { title: '3. Google Sign-In', body: 'If you choose to sign in with Google, we receive your Google account email address and an opaque identifier from Google. We do not receive your Google password, contacts, or any other Google data. The credential is verified against Google\'s token endpoint and then treated identically to an email/password account.' },
          { title: '4. How we use your data', body: 'We use your email solely to identify your account and for service communications (e.g. password reset, if implemented). Analytics data is used only to power the per-link analytics dashboard visible to you and administrators. We do not sell, share, or transfer your data to any third party except as required by law.' },
          { title: '5. Data storage & security', body: 'All data is stored in Cloudflare KV (a globally-distributed key-value store operated by Cloudflare, Inc.). Passwords are hashed with PBKDF2-SHA-256 and a random salt before storage. API endpoints are protected by JWT bearer tokens. HTTPS is enforced on all connections.' },
          { title: '6. Data retention', body: 'Your data is retained for as long as your account exists. You may request deletion at any time by emailing dhakad.kumawat18@gmail.com — we will permanently delete your account, all links you created, and all associated analytics within 30 days.' },
          { title: '7. Cookies', body: 'We do not use cookies. Authentication state is stored in your browser\'s localStorage as a JWT token.' },
          { title: '8. Children', body: 'The service is not directed at children under 13. We do not knowingly collect data from children.' },
          { title: '9. Changes to this policy', body: 'We may update this policy. The revision date at the top of this page will always reflect the most recent version. Continued use of the service after a change constitutes acceptance.' },
          { title: '10. Contact', body: 'Questions or requests regarding your data: dhakad.kumawat18@gmail.com' },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: C.mono, fontSize: 14, color: C.accent, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
            <p style={{ fontFamily: C.space, fontSize: 15, color: C.text, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────── Terms page ─────────────────────────────────────

function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <Link to="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <Link to="/" style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, textDecoration: 'none' }}>← back</Link>
      </nav>
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '64px 24px 80px', width: '100%' }}>
        <h1 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 48, color: C.text, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 48 }}>Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {[
          { title: '1. Acceptance', body: 'By accessing or using URL Baunafier ("the Service") you agree to be bound by these Terms. If you do not agree, do not use the Service.' },
          { title: '2. Eligibility', body: 'You must be at least 13 years old to use the Service. By using it you represent that you meet this requirement.' },
          { title: '3. Acceptable use', body: 'You may use the Service only for lawful purposes. You must not create shortened links that point to: spam, phishing pages, malware, illegal content, content that violates intellectual-property rights, or any material that could expose the operator to legal liability. Automated bulk link creation without prior written permission is prohibited.' },
          { title: '4. Account responsibility', body: 'You are responsible for all activity that occurs under your account. Keep your credentials secure. Notify dhakad.kumawat18@gmail.com immediately if you suspect unauthorised access.' },
          { title: '5. Link availability', body: 'We make reasonable efforts to keep the Service online, but we do not guarantee uptime or link availability. Links may be temporarily or permanently unavailable due to maintenance, abuse intervention, or technical failure. The Service is provided free of charge and on a best-effort basis.' },
          { title: '6. Link expiry & deletion', body: 'Links created with an expiry time will automatically stop redirecting after that time. The operator reserves the right to delete any link at any time, including links that violate these Terms or are otherwise deemed harmful.' },
          { title: '7. Termination', body: 'We reserve the right to suspend or permanently ban any account found to be in violation of these Terms, at our sole discretion and without prior notice.' },
          { title: '8. Disclaimer of warranties', body: 'The Service is provided "as is" without any warranty, express or implied. We disclaim all warranties including fitness for a particular purpose and non-infringement. Use the Service at your own risk.' },
          { title: '9. Limitation of liability', body: 'To the maximum extent permitted by applicable law, the operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.' },
          { title: '10. Governing law', body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Rajasthan, India.' },
          { title: '11. Changes', body: 'We may modify these Terms at any time. The revision date above will be updated. Continued use after a change constitutes acceptance of the new Terms.' },
          { title: '12. Contact', body: 'Questions about these Terms: dhakad.kumawat18@gmail.com' },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: C.mono, fontSize: 14, color: C.accent, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
            <p style={{ fontFamily: C.space, fontSize: 15, color: C.text, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────── 404 page ───────────────────────────────────────

function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.text, textAlign: 'center', padding: 24 }}>
      <div style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 80, color: C.border2, marginBottom: 16 }}>404</div>
      <p style={{ fontFamily: C.mono, fontSize: 16, color: C.muted, marginBottom: 32 }}>This page doesn't exist.</p>
      <Link to="/" style={{ fontFamily: C.mono, fontSize: 13, color: C.accent, textDecoration: 'none' }}>← go home</Link>
    </div>
  );
}

// ─────────────────────────── Global CSS ─────────────────────────────────────

const GLOBAL_CSS = `
@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes nameSlideIn { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: ${C.bg}; color: ${C.text}; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: ${C.bg}; }
::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 3px; }
input::placeholder { color: ${C.muted}; }
input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px ${C.bg} inset; -webkit-text-fill-color: ${C.text}; }
a { color: inherit; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 700px) {
  .link-row-grid { grid-template-columns: 80px 1fr 54px 80px !important; }
  .link-row-grid .col-created, .link-row-grid .col-actions { display: none; }
}
`;

// ─────────────────────────── App ────────────────────────────────────────────

export default function App() {
  const { toasts, show: toast } = useToast();
  return (
    <BrowserRouter>
      <style>{GLOBAL_CSS}</style>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage toast={toast} />} />
          <Route path="/signup" element={<SignupPage toast={toast} />} />
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage toast={toast} /></PrivateRoute>
          } />
          <Route path="/v1/admin" element={
            <AdminRoute><AdminPage toast={toast} /></AdminRoute>
          } />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ToastStack toasts={toasts} />
      </AuthProvider>
    </BrowserRouter>
  );
}
