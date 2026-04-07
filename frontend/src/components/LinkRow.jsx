import { useState } from 'react';
import { C } from '../constants/theme';
import { Ic } from '../constants/icons';
import { API } from '../services/api';
import { QRButton } from './QRButton';
import { IconBtn } from './ui/IconBtn';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { AnalyticsPanel } from './AnalyticsPanel';
import { EditModal } from './EditModal';

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
  const statusColor = !entry.enabled ? C.error : isExpired ? '#ff9900' : C.accent;
  const statusLabel = !entry.enabled ? 'disabled' : isExpired ? 'expired' : 'active';

  return (
    <>
      {editing && <EditModal entry={entry} token={token} onClose={() => setEditing(false)} onSave={onRefresh} toast={toast} />}
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 64px 110px 80px 200px',
        gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}`,
        alignItems: 'center', fontSize: 13,
      }}>
        <div style={{ overflow: 'hidden' }}>
          <a href={shortUrl} target="_blank" rel="noreferrer" style={{ fontFamily: C.mono, color: C.accent, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>/{entry.code}</a>
          {entry.password_hash && <span title="Password protected" style={{ marginLeft: 5, fontSize: 11, color: C.muted }}>🔒</span>}
          {entry.max_clicks && <span title={`Max ${entry.max_clicks} clicks`} style={{ marginLeft: 3, fontSize: 11, color: C.muted }}>⚡{entry.max_clicks}</span>}
        </div>
        <div style={{ overflow: 'hidden', fontFamily: C.mono, fontSize: 11, color: C.muted, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={entry.original_url}>
          {entry.original_url}
        </div>
        <div style={{ fontFamily: C.mono, color: C.text, textAlign: 'center' }}>{entry.clicks ?? 0}</div>
        <div style={{ fontFamily: C.mono, fontSize: 11, color: statusColor, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          {statusLabel}
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
          {new Date(entry.created_at).toLocaleDateString()}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <QRButton url={shortUrl} />
          <IconBtn icon={Ic.copy} onClick={copyLink} title="Copy link to clipboard" />
          <IconBtn icon={Ic.chart} onClick={() => setExpanded(e => !e)} title="View analytics" hoverColor={C.accent} style={{ background: expanded ? `${C.accent}22` : 'none', borderColor: expanded ? C.accent : C.border2, color: expanded ? C.accent : C.muted }} />
          <IconBtn icon={Ic.edit} onClick={() => setEditing(true)} title="Edit link" />
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
