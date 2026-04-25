import { useState } from 'react';
import { C } from '../constants/theme';
import { Ic } from '../constants/icons';
import { API } from '../services/api';
import { QRButton } from './QRButton';
import { AnalyticsPanel } from './AnalyticsPanel';
import { EditModal } from './EditModal';

/* inline sparkline */
function Spark({ data = [] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 60, h = 26;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  const fill = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id="spk" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity=".35" />
          <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#spk)" />
      <polyline points={pts} fill="none" stroke="#6C63FF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function LinkRow({ entry, token, onRefresh, toast }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const shortUrl = entry.short_url || `https://go.baunafier.qzz.io/${entry.code}`;

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
  const statusLabel = !entry.enabled ? 'off' : isExpired ? 'expired' : 'on';

  /* last 7-day sparkline placeholder from hourly_clicks if available */
  const sparkData = entry.recent_clicks || [];

  return (
    <>
      {editing && <EditModal entry={entry} token={token} onClose={() => setEditing(false)} onSave={onRefresh} toast={toast} />}
      <div className="lrow">
        {/* short code */}
        <div style={{ overflow: 'hidden' }}>
          <a href={shortUrl} target="_blank" rel="noreferrer"
            style={{ fontFamily: C.mono, color: C.accent, textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '.01em' }}>
            /{entry.code}
          </a>
          {entry.password_hash && <span title="Password protected" style={{ marginLeft: 5, fontSize: 10, color: C.muted }}>🔒</span>}
        </div>

        {/* original url */}
        <div style={{ overflow: 'hidden', fontFamily: C.mono, fontSize: 11, color: C.muted, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
          title={entry.original_url}>{entry.original_url}</div>

        {/* spark + clicks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Spark data={sparkData} />
          <span style={{ fontFamily: C.mono, fontSize: 13, color: C.text }}>{entry.clicks ?? 0}</span>
        </div>

        {/* status badge */}
        <span className={`badge ${statusLabel === 'on' ? 'on' : 'off'}`}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
          {statusLabel}
        </span>

        {/* toggle */}
        <button onClick={toggleEnabled} disabled={toggling}
          title={entry.enabled ? 'Disable' : 'Enable'}
          style={{
            background: entry.enabled ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${entry.enabled ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 20, width: 38, height: 22, cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0, padding: 0,
          }}>
          <span style={{
            position: 'absolute', top: 3, left: entry.enabled ? 18 : 3, width: 14, height: 14,
            borderRadius: '50%', background: entry.enabled ? C.accent : C.muted, transition: 'left .2s',
          }} />
        </button>

        {/* action icons */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
          <QRButton url={shortUrl} />
          <button className="bico" onClick={copyLink} title="Copy link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button className={`bico${expanded ? ' pk' : ''}`} onClick={() => setExpanded(e => !e)} title="Analytics">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </button>
          <button className="bico" onClick={() => setEditing(true)} title="Edit link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="bico red" onClick={deleteLink} title="Delete link" disabled={deleting}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', animation: 'expandD .22s cubic-bezier(.22,1,.36,1) both' }}>
          <AnalyticsPanel code={entry.code} token={token} />
        </div>
      )}
    </>
  );
}

