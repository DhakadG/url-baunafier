import { useState, useCallback, useEffect } from 'react';
import { C, inputStyle, actionBtn, primaryBtn, glass } from '../constants/theme';
import { API, listQRCodes, createQRCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NavBar } from '../layouts/MainLayout';
import { QRButton } from '../components/QRButton';
import { ExpiryPicker } from '../components/ExpiryPicker';
import { LinkRow } from '../components/LinkRow';
import { QRCodeRow } from '../components/QRCodeRow';

export function DashboardPage({ toast }) {
  const { token } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('links');

  // ── Links state ────────────────────────────────────────────────────────────
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
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [search, setSearch] = useState('');

  // ── QR state ───────────────────────────────────────────────────────────────
  const [qrSlug, setQrSlug] = useState('');
  const [qrName, setQrName] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrNotes, setQrNotes] = useState('');
  const [qrCreating, setQrCreating] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrSearch, setQrSearch] = useState('');

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
      fetchLinks();
    } catch { toast('Network error.', 'error'); }
    finally { setShortening(false); }
  }

  async function handleCreateQR(e) {
    e.preventDefault();
    if (!qrSlug.trim()) { toast('Slug is required.', 'error'); return; }
    if (!qrName.trim()) { toast('Name is required.', 'error'); return; }
    if (!qrUrl.trim()) { toast('Destination URL is required.', 'error'); return; }
    setQrCreating(true);
    try {
      const res = await createQRCode(token, {
        slug: qrSlug.trim(),
        name: qrName.trim(),
        url: qrUrl.trim(),
        notes: qrNotes.trim(),
      });
      if (!res.ok) { toast(res.data?.error || 'Could not create QR code.', 'error'); return; }
      toast('QR redirect created!', 'success');
      setQrSlug(''); setQrName(''); setQrUrl(''); setQrNotes('');
      fetchQRCodes();
    } catch { toast('Network error.', 'error'); }
    finally { setQrCreating(false); }
  }

  function copyResult() {
    if (result?.short_url) navigator.clipboard.writeText(result.short_url)
      .then(() => toast('Copied!', 'success'))
      .catch(() => toast('Copy failed.', 'error'));
  }

  const filteredLinks = links.filter(l =>
    !search || l.code.includes(search) || l.original_url.includes(search)
  );

  const filteredQR = qrCodes.filter(q =>
    !qrSearch || q.slug.includes(qrSearch) || q.name.toLowerCase().includes(qrSearch.toLowerCase()) || q.url.includes(qrSearch)
  );

  const tabStyle = (active) => ({
    background: active ? C.accent : 'none',
    color: active ? '#000' : C.muted,
    border: `1px solid ${active ? C.accent : C.border2}`,
    borderRadius: 7, padding: '6px 20px', fontFamily: C.mono, fontSize: 12,
    cursor: 'pointer', fontWeight: active ? 700 : 400, transition: 'all .15s',
  });

  return (
    <div style={{ minHeight: '100vh', color: C.text }}>
      <NavBar toast={toast} />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 36 }}>
          <button style={tabStyle(activeTab === 'links')} onClick={() => setActiveTab('links')}>
            ✦ Short Links
          </button>
          <button style={tabStyle(activeTab === 'qr')} onClick={() => setActiveTab('qr')}>
            ▦ QR Redirects
          </button>
        </div>

        {/* ── LINKS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'links' && (
          <>
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

            {/* Advanced options collapsible */}
            <div style={{ marginBottom: 12 }}>
              <button type="button" onClick={() => setAdvOpen(o => !o)} style={{
                background: 'none', border: `1px solid ${advOpen ? C.accent : C.border2}`, borderRadius: 6,
                color: advOpen ? C.accent : C.muted, fontFamily: C.mono, fontSize: 11, cursor: 'pointer',
                padding: '5px 14px', transition: 'color .15s, border-color .15s',
              }}>
                {advOpen ? '▲' : '▼'} Advanced options
              </button>
              {advOpen && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password protection (optional)"
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                  <input type="number" min="1" value={maxClicks} onChange={e => setMaxClicks(e.target.value)}
                    placeholder="Max clicks (optional)"
                    style={{ ...inputStyle, flex: '0 1 160px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                </div>
              )}
            </div>

            {/* Device routing & OG preview collapsible */}
            <div style={{ marginBottom: 18 }}>
              <button type="button" onClick={() => setDeviceOpen(o => !o)} style={{
                background: 'none', border: `1px solid ${deviceOpen ? C.accent : C.border2}`, borderRadius: 6,
                color: deviceOpen ? C.accent : C.muted, fontFamily: C.mono, fontSize: 11, cursor: 'pointer',
                padding: '5px 14px', transition: 'color .15s, border-color .15s',
              }}>
                {deviceOpen ? '▲' : '▼'} Device routing &amp; social preview
              </button>
              {deviceOpen && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <input value={iosUrl} onChange={e => setIosUrl(e.target.value)}
                    placeholder="iOS URL (e.g. apps.apple.com/…)"
                    style={{ ...inputStyle, flex: '1 1 220px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                  <input value={androidUrl} onChange={e => setAndroidUrl(e.target.value)}
                    placeholder="Android URL (e.g. play.google.com/…)"
                    style={{ ...inputStyle, flex: '1 1 220px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                  <input value={ogTitle} onChange={e => setOgTitle(e.target.value)}
                    placeholder="OG Title for social previews"
                    style={{ ...inputStyle, flex: '1 1 220px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                  <input value={ogDesc} onChange={e => setOgDesc(e.target.value)}
                    placeholder="OG Description"
                    style={{ ...inputStyle, flex: '1 1 220px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                  <input value={ogImage} onChange={e => setOgImage(e.target.value)}
                    placeholder="OG Image URL"
                    style={{ ...inputStyle, flex: '1 1 220px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                </div>
              )}
            </div>

            <button type="submit" disabled={shortening}
              style={{ ...primaryBtn, width: 'auto', padding: '10px 28px' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.boxShadow = '0 0 20px rgba(164,246,112,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = 'none'; }}
            >{shortening ? 'Shortening…' : 'Shorten ✦'}</button>
          </form>

          {result && (
            <div style={{
              ...glass, marginTop: 20,
              borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              animation: 'fadeUp .25s ease',
            }}>
              <div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginBottom: 4 }}>Your short link</div>
                <a href={result.short_url} target="_blank" rel="noreferrer" style={{ fontFamily: C.mono, fontSize: 18, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                  {result.short_url}
                </a>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <QRButton url={result.short_url} />
                <button onClick={copyResult}
                  style={{ ...actionBtn, color: C.accent, borderColor: C.accent, borderRadius: 8, padding: '6px 16px' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 14px rgba(164,246,112,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >Copy</button>
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
          <div className="link-row-grid" style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 64px 110px 80px 200px',
            gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border2}`,
            fontFamily: C.mono, fontSize: 10, color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <span>Alias</span><span>Original URL</span><span style={{ textAlign: 'center' }}>Clicks</span>
            <span>Status</span><span className="col-created">Created</span><span className="col-actions" style={{ textAlign: 'right' }}>Actions</span>
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
          </>
        )}

        {/* ── QR REDIRECTS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'qr' && (
          <>
            {/* Create QR form */}
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 28, color: C.text, marginBottom: 8 }}>
                Create a QR Redirect
              </h2>
              <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 24 }}>
                Create a named redirect behind a QR code. Scan live at{' '}
                <span style={{ color: C.accent }}>go.baunafier.qzz.io/qr/&lt;slug&gt;</span>
              </p>
              <form onSubmit={handleCreateQR}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <input
                    value={qrSlug}
                    onChange={e => setQrSlug(e.target.value)}
                    placeholder="slug (e.g. organic-wool)"
                    style={{ ...inputStyle, flex: '0 1 200px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2}
                  />
                  <input
                    value={qrName}
                    onChange={e => setQrName(e.target.value)}
                    placeholder="Name (e.g. Organic Wool)"
                    style={{ ...inputStyle, flex: '0 1 220px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <input
                    value={qrUrl}
                    onChange={e => setQrUrl(e.target.value)}
                    placeholder="https://destination-url.com"
                    style={{ ...inputStyle, flex: '1 1 320px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2}
                  />
                  <input
                    value={qrNotes}
                    onChange={e => setQrNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    style={{ ...inputStyle, flex: '1 1 220px' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2}
                  />
                </div>
                <button type="submit" disabled={qrCreating}
                  style={{ ...primaryBtn, width: 'auto', padding: '10px 28px' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.boxShadow = '0 0 20px rgba(164,246,112,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {qrCreating ? 'Creating…' : 'Create QR redirect ▦'}
                </button>
              </form>
            </section>

            {/* QR codes table */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 24, color: C.text }}>Your QR codes</h2>
                <input
                  value={qrSearch}
                  onChange={e => setQrSearch(e.target.value)}
                  placeholder="Filter QR codes…"
                  style={{ ...inputStyle, width: 200, fontSize: 12 }}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2}
                />
              </div>

              {/* Header row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 64px 100px 80px 200px',
                gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border2}`,
                fontFamily: C.mono, fontSize: 10, color: C.muted,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                <span>Slug</span>
                <span>Name / Destination</span>
                <span style={{ textAlign: 'center' }}>Scans</span>
                <span>Status</span>
                <span>Created</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {loadingQR ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
                  Loading QR codes…
                </div>
              ) : filteredQR.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
                  {qrSearch ? 'No QR codes match your filter.' : 'No QR redirects yet. Create one above!'}
                </div>
              ) : (
                filteredQR.map(entry => (
                  <QRCodeRow key={entry.slug} entry={entry} token={token} onRefresh={fetchQRCodes} toast={toast} />
                ))
              )}
            </section>
          </>
        )}

      </main>
    </div>
  );
}
