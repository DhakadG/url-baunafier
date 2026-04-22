import { useState } from 'react';
import { C } from '../constants/theme';
import { Ic } from '../constants/icons';
import { API } from '../services/api';
import { QRButton } from './QRButton';
import { IconBtn } from './ui/IconBtn';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { AnalyticsPanel } from './AnalyticsPanel';
import { QREditModal } from './QREditModal';
import { deleteQRCode, updateQRCode } from '../services/api';

export function QRCodeRow({ entry, token, onRefresh, toast }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const redirectUrl = `${API.replace('go.', 'go.')}/qr/${entry.slug}`;
  const shortUrl = `https://go.baunafier.qzz.io/qr/${entry.slug}`;

  async function toggleActive() {
    setToggling(true);
    try {
      const res = await updateQRCode(token, entry.slug, { active: !entry.active });
      if (!res.ok) { toast(res.data?.error || 'Failed to toggle.', 'error'); return; }
      toast(`QR code ${entry.active ? 'paused' : 'activated'}.`, 'success');
      onRefresh();
    } catch { toast('Network error.', 'error'); }
    finally { setToggling(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete QR code /${entry.slug}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await deleteQRCode(token, entry.slug);
      if (!res.ok) { toast(res.data?.error || 'Failed to delete.', 'error'); return; }
      toast('QR code deleted.', 'success');
      onRefresh();
    } catch { toast('Network error.', 'error'); }
    finally { setDeleting(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(shortUrl)
      .then(() => toast('Copied!', 'success'))
      .catch(() => toast('Copy failed.', 'error'));
  }

  const statusColor = entry.active ? C.accent : C.error;
  const statusLabel = entry.active ? 'active' : 'paused';

  return (
    <>
      {editing && (
        <QREditModal
          entry={entry}
          token={token}
          onClose={() => setEditing(false)}
          onSave={onRefresh}
          toast={toast}
        />
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 64px 100px 80px 200px',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${C.border}`,
        alignItems: 'center',
        fontSize: 13,
      }}>
        {/* Slug */}
        <div style={{ overflow: 'hidden' }}>
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: C.mono, color: C.accent, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
          >
            /qr/{entry.slug}
          </a>
        </div>

        {/* Name + destination */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontFamily: C.mono, fontSize: 13, color: C.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {entry.name}
          </div>
          <div
            style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
            title={entry.url}
          >
            {entry.url}
          </div>
          {entry.notes && (
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 2, fontStyle: 'italic' }}>
              {entry.notes}
            </div>
          )}
        </div>

        {/* Scans */}
        <div style={{ fontFamily: C.mono, color: C.text, textAlign: 'center' }}>
          {entry.total_scans ?? entry.clicks ?? 0}
        </div>

        {/* Status */}
        <div style={{ fontFamily: C.mono, fontSize: 11, color: statusColor, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          {statusLabel}
        </div>

        {/* Created date */}
        <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
          {new Date(entry.created).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <QRButton url={shortUrl} />
          <IconBtn icon={Ic.copy} onClick={copyLink} title="Copy QR redirect URL" />
          <IconBtn
            icon={Ic.chart}
            onClick={() => setExpanded(e => !e)}
            title="View scan analytics"
            hoverColor={C.accent}
            style={{
              background: expanded ? `${C.accent}22` : 'none',
              borderColor: expanded ? C.accent : C.border2,
              color: expanded ? C.accent : C.muted,
            }}
          />
          <IconBtn icon={Ic.edit} onClick={() => setEditing(true)} title="Edit QR code" />
          <ToggleSwitch enabled={entry.active} onToggle={toggleActive} disabled={toggling} />
          <IconBtn icon={Ic.trash} onClick={handleDelete} title="Delete QR code permanently" hoverColor={C.error} disabled={deleting} />
        </div>
      </div>

      {expanded && (
        <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
          <AnalyticsPanel
            code={entry.slug}
            token={token}
            statsEndpoint={`/api/qr/stats/${encodeURIComponent(entry.slug)}`}
          />
        </div>
      )}
    </>
  );
}
