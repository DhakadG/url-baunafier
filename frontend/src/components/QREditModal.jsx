import { useState } from 'react';
import { C, inputStyle, primaryBtn, actionBtn } from '../constants/theme';
import { updateQRCode } from '../services/api';

export function QREditModal({ entry, token, onClose, onSave, toast }) {
  const [name, setName] = useState(entry.name || '');
  const [url, setUrl] = useState(entry.url || '');
  const [notes, setNotes] = useState(entry.notes || '');
  const [active, setActive] = useState(entry.active !== false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) { toast('Name is required.', 'error'); return; }
    if (!url.trim()) { toast('Destination URL is required.', 'error'); return; }
    setSaving(true);
    try {
      const res = await updateQRCode(token, entry.slug, {
        name: name.trim(),
        url: url.trim(),
        notes: notes.trim(),
        active,
      });
      if (!res.ok) { toast(res.data?.error || 'Save failed.', 'error'); return; }
      toast('QR code updated.', 'success');
      onSave();
      onClose();
    } catch { toast('Network error.', 'error'); }
    finally { setSaving(false); }
  }

  const iStyle = { ...inputStyle, width: '100%', marginBottom: 0 };
  const labelStyle = {
    fontFamily: C.mono, fontSize: 11, color: C.muted, display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.card, border: `1px solid ${C.border2}`, borderRadius: 14,
        padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 22, color: C.text }}>
            Edit /qr/{entry.slug}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Name */}
        <div>
          <label style={labelStyle}>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Organic Wool"
            style={iStyle}
            onFocus={e => e.currentTarget.style.borderColor = C.accent}
            onBlur={e => e.currentTarget.style.borderColor = C.border2}
          />
        </div>

        {/* Destination URL */}
        <div>
          <label style={labelStyle}>Destination URL</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/provenance-page"
            style={iStyle}
            onFocus={e => e.currentTarget.style.borderColor = C.accent}
            onBlur={e => e.currentTarget.style.borderColor = C.border2}
          />
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. F/W 26 · Blazer, Trouser"
            style={iStyle}
            onFocus={e => e.currentTarget.style.borderColor = C.accent}
            onBlur={e => e.currentTarget.style.borderColor = C.border2}
          />
        </div>

        {/* Active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              style={{ marginRight: 8, accentColor: C.accent }}
            />
            Active (redirecting)
          </label>
          {!active && (
            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.error }}>
              Paused — scanners will see a "coming soon" page
            </span>
          )}
        </div>

        {/* Slug info (read-only) */}
        <div style={{
          background: `${C.accent}0a`, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '10px 14px', fontFamily: C.mono, fontSize: 11, color: C.muted,
        }}>
          Redirect URL: <span style={{ color: C.accent }}>https://go.baunafier.qzz.io/qr/{entry.slug}</span>
          <br />
          <span style={{ fontSize: 10, opacity: 0.6 }}>Slug cannot be changed after creation.</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={save} disabled={saving} style={{ ...primaryBtn, flex: 1 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={onClose} style={{ ...actionBtn, flex: '0 0 auto', padding: '10px 18px' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
