import { useState } from 'react';
import { C, inputStyle, primaryBtn, actionBtn } from '../constants/theme';
import { API } from '../services/api';

export function EditModal({ entry, token, onClose, onSave, toast }) {
  const [originalUrl, setOriginalUrl] = useState(entry.original_url || '');
  const [password, setPassword] = useState('');
  const [clearPassword, setClearPassword] = useState(false);
  const [maxClicks, setMaxClicks] = useState(entry.max_clicks || '');
  const [iosUrl, setIosUrl] = useState(entry.ios_url || '');
  const [androidUrl, setAndroidUrl] = useState(entry.android_url || '');
  const [ogTitle, setOgTitle] = useState(entry.og_title || '');
  const [ogDesc, setOgDesc] = useState(entry.og_description || '');
  const [ogImage, setOgImage] = useState(entry.og_image || '');
  const [saving, setSaving] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [deviceOpen, setDeviceOpen] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const body = { original_url: originalUrl.trim() };
      if (clearPassword) { body.password = null; }
      else if (password) { body.password = password; }
      if (maxClicks !== '') body.max_clicks = maxClicks === 0 ? null : Number(maxClicks);
      if (iosUrl.trim() !== entry.ios_url) body.ios_url = iosUrl.trim() || null;
      if (androidUrl.trim() !== entry.android_url) body.android_url = androidUrl.trim() || null;
      body.og_title = ogTitle.trim() || null;
      body.og_description = ogDesc.trim() || null;
      body.og_image = ogImage.trim() || null;

      const r = await fetch(`${API}/api/links/${entry.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { toast(d.error || 'Save failed.', 'error'); return; }
      toast('Link updated.', 'success');
      onSave();
      onClose();
    } catch { toast('Network error.', 'error'); }
    finally { setSaving(false); }
  }

  const iStyle = { ...inputStyle, width: '100%', marginBottom: 0 };
  const labelStyle = { fontFamily: C.mono, fontSize: 11, color: C.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
  const sectionBtn = (open) => ({
    background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6, color: open ? C.accent : C.muted,
    fontFamily: C.mono, fontSize: 11, cursor: 'pointer', padding: '5px 12px', width: '100%', textAlign: 'left',
    transition: 'color .15s, border-color .15s', borderColor: open ? C.accent : C.border2,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 22, color: C.text }}>Edit /{entry.code}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div>
          <label style={labelStyle}>Destination URL</label>
          <input value={originalUrl} onChange={e => setOriginalUrl(e.target.value)} style={iStyle}
            onFocus={e => e.currentTarget.style.borderColor = C.accent}
            onBlur={e => e.currentTarget.style.borderColor = C.border2} />
        </div>

        <div>
          <button style={sectionBtn(advOpen)} onClick={() => setAdvOpen(o => !o)}>
            {advOpen ? '▲' : '▼'} Advanced options
          </button>
          {advOpen && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Password {entry.password_hash ? '(currently set)' : ''}</label>
                {entry.password_hash && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={clearPassword} onChange={e => setClearPassword(e.target.checked)} />
                    Remove current password
                  </label>
                )}
                {!clearPassword && (
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={entry.password_hash ? 'Enter new password to replace…' : 'Set a password (optional)'}
                    style={iStyle}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.border2} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Max clicks (0 = unlimited)</label>
                <input type="number" min="0" value={maxClicks} onChange={e => setMaxClicks(e.target.value)}
                  placeholder="e.g. 100" style={iStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2} />
              </div>
            </div>
          )}
        </div>

        <div>
          <button style={sectionBtn(deviceOpen)} onClick={() => setDeviceOpen(o => !o)}>
            {deviceOpen ? '▲' : '▼'} Device routing & social preview
          </button>
          {deviceOpen && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>iOS URL (overrides destination for iPhone/iPad)</label>
                <input value={iosUrl} onChange={e => setIosUrl(e.target.value)} placeholder="https://apps.apple.com/…" style={iStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2} />
              </div>
              <div>
                <label style={labelStyle}>Android URL (overrides destination for Android)</label>
                <input value={androidUrl} onChange={e => setAndroidUrl(e.target.value)} placeholder="https://play.google.com/…" style={iStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2} />
              </div>
              <div>
                <label style={labelStyle}>OG Title (for social media previews)</label>
                <input value={ogTitle} onChange={e => setOgTitle(e.target.value)} placeholder="e.g. Check out this link!" style={iStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2} />
              </div>
              <div>
                <label style={labelStyle}>OG Description</label>
                <input value={ogDesc} onChange={e => setOgDesc(e.target.value)} placeholder="Brief description for link previews" style={iStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2} />
              </div>
              <div>
                <label style={labelStyle}>OG Image URL</label>
                <input value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://example.com/image.jpg" style={iStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border2} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={save} disabled={saving} style={{ ...primaryBtn, flex: 1 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={onClose} style={{ ...actionBtn, flex: '0 0 auto', padding: '10px 18px' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
