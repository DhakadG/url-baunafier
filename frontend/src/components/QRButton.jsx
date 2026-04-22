import { useState } from 'react';
import { C } from '../constants/theme';
import { Ic } from '../constants/icons';
import { QRCodeModal } from './QRCodeModal';

export function QRButton({ url }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Generate QR Code"
        style={{
          background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6,
          color: C.muted, cursor: 'pointer', padding: '5px 7px', lineHeight: 0,
          display: 'flex', alignItems: 'center', transition: 'color .15s, border-color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border2; }}
      >
        {Ic.qr}
      </button>
      {open && <QRCodeModal url={url} onClose={() => setOpen(false)} />}
    </>
  );
}
