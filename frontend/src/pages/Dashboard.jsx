import { useState, useCallback, useEffect, useRef } from 'react';
import { C } from '../constants/theme';
import { API, listQRCodes, createQRCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QRButton } from '../components/QRButton';
import { ExpiryPicker } from '../components/ExpiryPicker';
import { LinkRow } from '../components/LinkRow';
import { QRCodeRow } from '../components/QRCodeRow';
import { QRBulkPanel } from '../components/QRBulkPanel';
import { QRBatch } from '../components/QRBatch';
import { QRDecodePanel } from '../components/QRDecodePanel';
import { AnalyticsPanel } from '../components/AnalyticsPanel';

/* ── Count-up hook ────────────────────────────────────────────────────────── */
function useCount(target, ms = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (ms / 16)));
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(start);
    }, 16);
    return () => clearInterval(t);
  }, [target, ms]);
  return val;
}

/* ── Ambient background for dashboard ────────────────────────────────────── */
function AmbientBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', top: -200, left: -100, background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)', animation: 'floatA 20s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bottom: 0, right: -100, background: 'radial-gradient(circle, rgba(255,99,184,0.07) 0%, transparent 70%)', animation: 'floatB 25s ease-in-out infinite' }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, variant = 'p', icon }) {
  const n = useCount(typeof value === 'number' ? value : 0);
  return (
    <div className="gcard" style={{ position: 'relative', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
      <div className={`sc-${variant}`} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</span>
        {icon && <span style={{ fontSize: 16, opacity: 0.5 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 32, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {typeof value === 'number' ? n.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>{sub}</div>}
    </div>
  );
}

/* ── Sidebar nav item ─────────────────────────────────────────────────────── */
function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={`nv${active ? ' active' : ''}`} onClick={onClick}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span>{label}</span>
      {active && <span className="nv-dot" />}
    </button>
  );
}

/* ── Create panel (slide-in) ─────────────────────────────────────────────── */
function CreatePanel({ token, toast, onCreated, onClose }) {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(null);
  const [password, setPassword] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDesc, setOgDesc] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [result, setResult] = useState(null);

  async function handleShorten(e) {
    e.preventDefault();
    if (!url.trim()) { toast('Enter a URL.', 'error'); return; }
    setShortening(true);
    try {
      const body = { url: url.trim() };
      if (alias.trim()) body.alias = alias.trim();
      if (expiryMinutes) body.expires_minutes = expiryMinutes;
      if (password) body.password = password;
      if (maxClicks) body.max_clicks = Number(maxClicks);
      if (iosUrl.trim()) body.ios_url = iosUrl.trim();
      if (androidUrl.trim()) body.android_url = androidUrl.trim();
      if (ogTitle.trim()) body.og_title = ogTitle.trim();
      if (ogDesc.trim()) body.og_description = ogDesc.trim();
      if (ogImage.trim()) body.og_image = ogImage.trim();
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
      setPassword(''); setMaxClicks('');
      setIosUrl(''); setAndroidUrl('');
      setOgTitle(''); setOgDesc(''); setOgImage('');
      onCreated();
    } catch { toast('Network error.', 'error'); }
    finally { setShortening(false); }
  }

  function copyResult() {
    if (result?.short_url) navigator.clipboard.writeText(result.short_url)
      .then(() => toast('Copied!', 'success'))
      .catch(() => toast('Copy failed.', 'error'));
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="panel">
        {/* header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 20, color: C.text }}>New short link</h3>
          <button className="bico" onClick={onClose}>✕</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', paddingTop: 40, textAlign: 'center', animation: 'fadeUp .3s both' }}>
              <div style={{ fontSize: 48 }}>✦</div>
              <h4 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 22, color: C.text }}>Link created!</h4>
              <a href={result.short_url} target="_blank" rel="noreferrer"
                style={{ fontFamily: C.mono, fontSize: 18, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
                {result.short_url}
              </a>
              <div style={{ display: 'flex', gap: 10 }}>
                <QRButton url={result.short_url} />
                <button className="btn-p" onClick={copyResult}>Copy link</button>
              </div>
              <button className="btn-g" onClick={() => setResult(null)} style={{ marginTop: 8 }}>Create another</button>
            </div>
          ) : (
            <form onSubmit={handleShorten} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>Destination URL *</label>
                <input className="inp" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/very-long-url" />
              </div>
              <div>
                <label style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>Custom alias</label>
                <input className="inp" value={alias} onChange={e => setAlias(e.target.value)} placeholder="custom-slug (optional)" />
              </div>
              <div>
                <label style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>Expiry</label>
                <ExpiryPicker value={expiryMinutes} onChange={setExpiryMinutes} />
              </div>

              <button type="button" className="accbtn" onClick={() => setAdvOpen(o => !o)}>
                <span style={{ fontFamily: C.mono, fontSize: 12 }}>Advanced options</span>
                <span style={{ fontSize: 10 }}>{advOpen ? '▲' : '▼'}</span>
              </button>
              {advOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'expandD .2s both' }}>
                  <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password protection (optional)" />
                  <input className="inp" type="number" min="1" value={maxClicks} onChange={e => setMaxClicks(e.target.value)} placeholder="Max clicks (optional)" />
                </div>
              )}

              <button type="button" className="accbtn" onClick={() => setDeviceOpen(o => !o)}>
                <span style={{ fontFamily: C.mono, fontSize: 12 }}>Device routing &amp; OG preview</span>
                <span style={{ fontSize: 10 }}>{deviceOpen ? '▲' : '▼'}</span>
              </button>
              {deviceOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'expandD .2s both' }}>
                  <input className="inp" value={iosUrl} onChange={e => setIosUrl(e.target.value)} placeholder="iOS URL" />
                  <input className="inp" value={androidUrl} onChange={e => setAndroidUrl(e.target.value)} placeholder="Android URL" />
                  <input className="inp" value={ogTitle} onChange={e => setOgTitle(e.target.value)} placeholder="OG Title" />
                  <input className="inp" value={ogDesc} onChange={e => setOgDesc(e.target.value)} placeholder="OG Description" />
                  <input className="inp" value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="OG Image URL" />
                </div>
              )}

              <button type="submit" className="btn-p" disabled={shortening} style={{ marginTop: 4 }}>
                {shortening ? 'Shortening…' : 'Create short link ✦'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Create QR Panel ──────────────────────────────────────────────────────── */
function CreateQRPanel({ token, toast, onCreated, onClose }) {
  const [qrSlug, setQrSlug] = useState('');
  const [qrName, setQrName] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrNotes, setQrNotes] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!qrSlug.trim()) { toast('Slug is required.', 'error'); return; }
    if (!qrName.trim()) { toast('Name is required.', 'error'); return; }
    if (!qrUrl.trim()) { toast('Destination URL is required.', 'error'); return; }
    setCreating(true);
    try {
      const res = await createQRCode(token, { slug: qrSlug.trim(), name: qrName.trim(), url: qrUrl.trim(), notes: qrNotes.trim() });
      if (!res.ok) { toast(res.data?.error || 'Could not create QR code.', 'error'); return; }
      toast('QR redirect created!', 'success');
      setQrSlug(''); setQrName(''); setQrUrl(''); setQrNotes('');
      onCreated();
      onClose();
    } catch { toast('Network error.', 'error'); }
    finally { setCreating(false); }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="panel">
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 20, color: C.text }}>New QR redirect</h3>
          <button className="bico" onClick={onClose}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>Slug *</label>
              <input className="inp" value={qrSlug} onChange={e => setQrSlug(e.target.value)} placeholder="e.g. organic-wool" />
            </div>
            <div>
              <label style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>Name *</label>
              <input className="inp" value={qrName} onChange={e => setQrName(e.target.value)} placeholder="e.g. Organic Wool Campaign" />
            </div>
            <div>
              <label style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>Destination URL *</label>
              <input className="inp" value={qrUrl} onChange={e => setQrUrl(e.target.value)} placeholder="https://destination-url.com" />
            </div>
            <div>
              <label style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>Notes</label>
              <input className="inp" value={qrNotes} onChange={e => setQrNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            <button type="submit" className="btn-p pk" disabled={creating} style={{ marginTop: 4 }}>
              {creating ? 'Creating…' : 'Create QR redirect ▦'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export function DashboardPage({ toast }) {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('links');
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateQR, setShowCreateQR] = useState(false);

  // ── Links state
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [search, setSearch] = useState('');

  // ── QR state
  const [qrCodes, setQrCodes] = useState([]);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrSearch, setQrSearch] = useState('');
  const [selectedQRSlugs, setSelectedQRSlugs] = useState(new Set());

  const fetchLinks = useCallback(async () => {
    setLoadingLinks(true);
    try {
      const r = await fetch(`${API}/api/links`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setLinks(Array.isArray(d) ? d : []);
    } catch { setLinks([]); }
    finally { setLoadingLinks(false); }
  }, [token]);

  const fetchQRCodes = useCallback(async () => {
    setLoadingQR(true);
    try {
      const d = await listQRCodes(token);
      setQrCodes(Array.isArray(d) ? d : []);
    } catch { setQrCodes([]); }
    finally { setLoadingQR(false); }
  }, [token]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);
  useEffect(() => { if (activeTab === 'qr') fetchQRCodes(); }, [activeTab, fetchQRCodes]);

  const filteredLinks = links.filter(l =>
    !search || l.code.includes(search) || l.original_url.includes(search)
  );
  const filteredQR = qrCodes.filter(q =>
    !qrSearch || q.slug.includes(qrSearch) || q.name.toLowerCase().includes(qrSearch.toLowerCase()) || q.url.includes(qrSearch)
  );

  const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0);
  const activeLinks = links.filter(l => l.enabled && !(l.expires_at && new Date(l.expires_at) < new Date())).length;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', position: 'relative' }}>
      <AmbientBg />

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 228, zIndex: 100,
        background: 'rgba(14,12,26,0.75)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* ── sidebar edge glow */}
        <div style={{ position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 1, background: 'linear-gradient(180deg, transparent, rgba(108,99,255,0.35), transparent)' }} />

        {/* logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 60 60" fill="none" className="bauna-mark">
            <rect width="60" height="60" rx="12" fill="rgba(108,99,255,0.15)"/>
            <path d="M38 18c2 0 3.5 1.5 3.5 3.5 0 1-.5 1.8-1 2.5l-3.5 5c-1.5 2-1.5 2.8.5 4.5l3.5 3c3.5 2.8 6.5 6 6.5 10 0 3.5-2 6.5-5 8s-6 3-9 1.5l-4-2.5c-2.5-2-4.5-4.5-7-6.5l-2-2.5 2.5-4 2.5 2c3 4 6 7.5 9.5 9.5 2 1.5 4 2 5.5 1 1.5-.7 2.5-2 2.5-3.5 0-2.5-2.5-5.5-5-7.5l-4-3c-2-1.5-3-3-3-5 0-1.5 1-3 2-4.5l-1 .5c-.5-.5-1-1-1.5-1.5 1.5-2 2.5-3.5 5-4z" fill="#6C63FF"/>
            <path d="M22 12c.7 0 2.5 0 3.5.5 4 .5 6.5 3 9 5.5 4 4 7 8 10 12.5l-2.5 3.5-2.5-3c-1.5-2-3-4-4.5-6-2.5-3.5-5.5-7-8.5-9.5-1.5-1.5-3-2.5-5-2.5-1.5 0-3 .7-4 2-1.5 2-1.5 5 0 7 1.5 2.5 4 4.5 6 6.5l4.5 4c1.5 1.5 3 3 3.5 5 1.5 4-1.5 7-3.5 10l.5-.5 1.5 2.5-2.5 3.5c-1.5-.5-2.5-1.5-3-3s0-3.5.5-5l-4.5-4.5c-3.5-3-7-5.5-9.5-9.5-1.5-2.5-2.5-5-2.5-8 0-3 1-6 3-8 2.5-2 5-3.5 8.5-4z" fill="#6C63FF" opacity=".7"/>
          </svg>
          <span style={{ fontFamily: C.display, fontWeight: 800, fontSize: 16, color: C.text, letterSpacing: '-0.02em' }}>Baunafier</span>
        </div>

        {/* nav items */}
        <nav style={{ flex: 1, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem icon="✦" label="Short Links" active={activeTab === 'links'} onClick={() => setActiveTab('links')} />
          <NavItem icon="▦" label="QR Codes" active={activeTab === 'qr'} onClick={() => setActiveTab('qr')} />
          <NavItem icon="◉" label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon="◈" label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        {/* user */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <button className="btn-g btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>Logout</button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div style={{ marginLeft: 228, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

        {/* TopBar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 90, height: 62,
          background: 'rgba(14,12,26,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
        }}>
          <div>
            <h1 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.02em' }}>
              {activeTab === 'links' && 'Short Links'}
              {activeTab === 'qr' && 'QR Codes'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {activeTab === 'links' && (
              <button className="btn-p btn-sm" onClick={() => setShowCreate(true)}>+ New link</button>
            )}
            {activeTab === 'qr' && (
              <button className="btn-p pk btn-sm" onClick={() => setShowCreateQR(true)}>+ New QR</button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '32px', maxWidth: 1080, width: '100%' }}>

          {/* ── LINKS TAB ── */}
          {activeTab === 'links' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeUp .3s both' }}>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                <StatCard label="Total links" value={links.length} icon="✦" variant="p" />
                <StatCard label="Active" value={activeLinks} icon="●" variant="lm" />
                <StatCard label="Total clicks" value={totalClicks} icon="◉" variant="pk" />
                <StatCard label="QR codes" value={qrCodes.length} icon="▦" variant="am" />
              </div>

              {/* Search + table */}
              <div className="gcard" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input className="inp" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search links…" style={{ width: 240 }} />
                  <span style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
                    {filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* header */}
                <div className="lrow" style={{ padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  <span>Alias</span><span>Destination</span><span>Trend · Clicks</span>
                  <span>Status</span><span>Toggle</span><span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                {loadingLinks ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading…</div>
                ) : filteredLinks.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
                    {search ? 'No links match your search.' : 'No links yet. Click "+ New link" to create one.'}
                  </div>
                ) : filteredLinks.map(entry => (
                  <LinkRow key={entry.code} entry={entry} token={token} onRefresh={fetchLinks} toast={toast} />
                ))}
              </div>
            </div>
          )}

          {/* ── QR TAB ── */}
          {activeTab === 'qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp .3s both' }}>
              <div className="gcard" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input className="inp" value={qrSearch} onChange={e => setQrSearch(e.target.value)}
                    placeholder="Search QR codes…" style={{ width: 240 }} />
                  <span style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
                    {filteredQR.length} QR code{filteredQR.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '20px 120px 1fr 64px 100px 80px 200px',
                  gap: 12, padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em',
                }}>
                  <input type="checkbox"
                    checked={filteredQR.length > 0 && filteredQR.every(q => selectedQRSlugs.has(q.slug))}
                    onChange={e => {
                      if (e.target.checked) setSelectedQRSlugs(new Set(filteredQR.map(q => q.slug)));
                      else setSelectedQRSlugs(new Set());
                    }}
                    aria-label="Select all"
                    style={{ accentColor: C.accent, width: 14, height: 14, cursor: 'pointer' }}
                  />
                  <span>Slug</span><span>Name / Destination</span>
                  <span style={{ textAlign: 'center' }}>Scans</span>
                  <span>Status</span><span>Created</span><span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                {loadingQR ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Loading…</div>
                ) : filteredQR.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
                    {qrSearch ? 'No QR codes match.' : 'No QR redirects yet. Click "+ New QR".'}
                  </div>
                ) : filteredQR.map(entry => (
                  <QRCodeRow key={entry.slug} entry={entry} token={token} onRefresh={fetchQRCodes} toast={toast}
                    selected={selectedQRSlugs.has(entry.slug)}
                    onSelect={(slug, checked) => setSelectedQRSlugs(prev => {
                      const next = new Set(prev);
                      if (checked) next.add(slug); else next.delete(slug);
                      return next;
                    })}
                  />
                ))}
              </div>

              {/* Bulk / Decode panels */}
              <details style={{ marginTop: 4 }}>
                <summary className="accbtn" style={{ listStyle: 'none', display: 'flex', cursor: 'pointer' }}>
                  <span>⇅ Bulk Import / Export</span>
                  {selectedQRSlugs.size > 0 && (
                    <span style={{ marginLeft: 8, background: C.accent, color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                      {selectedQRSlugs.size} selected
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto' }}>▼</span>
                </summary>
                <div style={{ padding: '16px 0' }}>
                  <QRBulkPanel selectedSlugs={selectedQRSlugs} qrCodes={qrCodes} token={token} onRefresh={fetchQRCodes} toast={toast} />
                </div>
              </details>
              <details>
                <summary className="accbtn" style={{ listStyle: 'none', display: 'flex', cursor: 'pointer' }}>
                  <span>⊞ Batch QR Image Export</span><span style={{ marginLeft: 'auto' }}>▼</span>
                </summary>
                <div style={{ padding: '16px 0' }}>
                  <QRBatch baseOptions={{ dotType:'rounded', cornerSq:'extra-rounded', cornerDot:'dot', dark:'#0a0a0a', light:'#6C63FF', ecLevel:'M' }} />
                </div>
              </details>
              <details>
                <summary className="accbtn" style={{ listStyle: 'none', display: 'flex', cursor: 'pointer' }}>
                  <span>⊙ Decode QR from Image</span><span style={{ marginLeft: 'auto' }}>▼</span>
                </summary>
                <div style={{ padding: '16px 0' }}>
                  <QRDecodePanel />
                </div>
              </details>
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp .3s both' }}>
              <p style={{ fontFamily: C.mono, fontSize: 13, color: C.muted }}>Select a link to view its analytics, or browse per-link analytics inline in the Links tab.</p>
              {links.slice(0, 10).map(l => (
                <div key={l.code} className="gcard" style={{ padding: '18px 20px' }}>
                  <div style={{ fontFamily: C.mono, fontSize: 13, color: C.accent, fontWeight: 600, marginBottom: 12 }}>/{l.code}</div>
                  <AnalyticsPanel code={l.code} token={token} />
                </div>
              ))}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp .3s both', maxWidth: 580 }}>
              <div className="gcard" style={{ padding: '24px 26px' }}>
                <h3 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 18 }}>Account</h3>
                <div style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, marginBottom: 6 }}>Email</div>
                <div style={{ fontFamily: C.mono, fontSize: 14, color: C.text, marginBottom: 20 }}>{user?.email}</div>
                <div style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, marginBottom: 6 }}>Role</div>
                <div style={{ fontFamily: C.mono, fontSize: 14, color: C.text }}>{user?.role || 'user'}</div>
              </div>
              <div className="gcard" style={{ padding: '24px 26px' }}>
                <h3 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 18 }}>Danger zone</h3>
                <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 16 }}>Permanently delete your account and all associated data.</p>
                <button className="btn-g" style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}
                  onClick={() => toast('Account deletion not yet available.', 'error')}>
                  Delete account
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Create panels ── */}
      {showCreate && <CreatePanel token={token} toast={toast} onCreated={fetchLinks} onClose={() => setShowCreate(false)} />}
      {showCreateQR && <CreateQRPanel token={token} toast={toast} onCreated={fetchQRCodes} onClose={() => setShowCreateQR(false)} />}
    </div>
  );
}

