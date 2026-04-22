import { useRef, useState } from 'react';
import { C, inputStyle, primaryBtn } from '../constants/theme';
import { createQRCode } from '../services/api';

// CSV export headers: slug,name,url,notes,created_at,scan_count,active
// CSV import headers: slug,name,url,notes (slug+name+url required)

const EXPORT_HEADERS = ['slug', 'name', 'url', 'notes', 'created_at', 'scan_count', 'active'];

const outlineBtn = {
  background: 'none', border: `1px solid`, borderRadius: 7,
  fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
  padding: '7px 16px', transition: 'color .12s, border-color .12s',
};

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsvRows(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });
    if (row.slug && row.name && row.url) rows.push(row);
  }
  return rows;
}

export function QRBulkPanel({ selectedSlugs = new Set(), qrCodes = [], token, onRefresh, toast }) {
  const fileInputRef = useRef(null);
  const [importing, setImporting]   = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult,   setImportResult]   = useState(null);

  // ── Export selected rows as CSV ─────────────────────────────────────────
  function exportSelected() {
    const rows = selectedSlugs.size > 0
      ? qrCodes.filter(q => selectedSlugs.has(q.slug))
      : qrCodes;
    if (rows.length === 0) { toast('No QR codes to export.', 'error'); return; }
    const lines = [EXPORT_HEADERS.join(',')];
    rows.forEach(q => {
      lines.push([
        escapeCsv(q.slug),
        escapeCsv(q.name),
        escapeCsv(q.url),
        escapeCsv(q.notes || ''),
        escapeCsv(q.created ? new Date(q.created).toISOString() : ''),
        escapeCsv(q.total_scans ?? q.clicks ?? 0),
        escapeCsv(q.active ? 'true' : 'false'),
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-redirects-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Exported ${rows.length} QR code${rows.length > 1 ? 's' : ''}.`, 'success');
  }

  // ── Import CSV ────────────────────────────────────────────────────────────
  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportResult(null);

    const text = await file.text();
    const rows = parseCsvRows(text);
    if (!rows || rows.length === 0) {
      toast('No valid rows found. Required columns: slug, name, url', 'error');
      return;
    }
    if (rows.length > 200) { toast('Max 200 rows per import.', 'error'); return; }

    setImporting(true);
    setImportProgress({ done: 0, total: rows.length });
    let ok = 0, fail = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const res = await createQRCode(token, { slug: r.slug, name: r.name, url: r.url, notes: r.notes || '' });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
      setImportProgress({ done: i + 1, total: rows.length });
    }

    setImporting(false);
    setImportProgress(null);
    setImportResult({ ok, fail });
    if (ok > 0) onRefresh();
    toast(`Import complete: ${ok} created, ${fail} failed.`, ok > 0 ? 'success' : 'error');
  }

  const selectedCount = selectedSlugs.size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>
        Export QR redirect records to CSV, or import new records in bulk.
      </p>

      {/* Export */}
      <div>
        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Export
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={exportSelected}
            style={{ ...outlineBtn, borderColor: selectedCount > 0 ? C.accent : C.border2, color: selectedCount > 0 ? C.accent : C.muted }}
            onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = selectedCount > 0 ? C.accent : C.muted; e.currentTarget.style.borderColor = selectedCount > 0 ? C.accent : C.border2; }}>
            ↓ {selectedCount > 0 ? `Export ${selectedCount} selected` : 'Export all'} as CSV
          </button>
          {selectedCount > 0 && (
            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
              {selectedCount} row{selectedCount > 1 ? 's' : ''} selected (use checkboxes in table above)
            </span>
          )}
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 6 }}>
          Columns: <span style={{ color: C.accent }}>{EXPORT_HEADERS.join(', ')}</span>
        </div>
      </div>

      {/* Import */}
      <div>
        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Import
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.6 }}>
          Upload a CSV with headers:{' '}
          <span style={{ color: C.accent }}>slug, name, url, notes</span>
          {' '}— slug, name and url are required.
        </div>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border2}`,
          color: C.muted, fontFamily: C.mono, fontSize: 12, transition: 'border-color .12s',
          opacity: importing ? 0.5 : 1, pointerEvents: importing ? 'none' : 'auto',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border2}>
          ↑ Upload CSV to import
          <input ref={fileInputRef} type="file" accept=".csv,text/csv,text/plain"
            onChange={handleImportFile} style={{ display: 'none' }} aria-label="Upload import CSV" />
        </label>

        {/* Progress */}
        {importProgress && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 5 }}>
              Importing {importProgress.done} / {importProgress.total}…
            </div>
            <div style={{ height: 4, background: C.border2, borderRadius: 2, overflow: 'hidden', width: 260 }}>
              <div style={{
                height: '100%', background: C.accent, borderRadius: 2,
                width: `${(importProgress.done / importProgress.total) * 100}%`,
                transition: 'width .2s',
              }} />
            </div>
          </div>
        )}

        {/* Result */}
        {importResult && !importing && (
          <div style={{ marginTop: 8, fontFamily: C.mono, fontSize: 12, color: importResult.fail > 0 ? C.warning : C.accent }}>
            ✓ {importResult.ok} created
            {importResult.fail > 0 && ` · ${importResult.fail} failed (duplicate slugs or invalid data)`}
          </div>
        )}
      </div>
    </div>
  );
}
