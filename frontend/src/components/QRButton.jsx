import { useState } from 'react';
import { C } from '../constants/theme';
import { Ic } from '../constants/icons';

export function QRButton({ url }) {
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
