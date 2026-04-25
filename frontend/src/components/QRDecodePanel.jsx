import { useRef, useState } from 'react';
import jsQR from 'jsqr';
import { C } from '../constants/theme';
import { detectDataType } from '../utils/qrDataEncoding';

const outlineBtn = {
  background: 'none', border: `1px solid`, borderRadius: 7,
  fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
  padding: '7px 16px', transition: 'color .12s, border-color .12s',
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 5 }}>
      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label} </span>
      <span style={{ fontFamily: C.mono, fontSize: 13, color: C.text, wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function ParsedResult({ raw }) {
  const parsed = detectDataType(raw);
  async function copyRaw() {
    try { await navigator.clipboard.writeText(raw); } catch {}
  }
  if (!parsed) return (
    <div style={{ fontFamily: C.mono, fontSize: 13, color: C.text, wordBreak: 'break-all' }}>{raw}</div>
  );
  const { type, data } = parsed;
  return (
    <div>
      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Detected: {type}
      </div>
      {type === 'url'      && <><Field label="URL" value={data.url} /><a href={data.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: C.mono, fontSize: 11, color: C.accent }}>Open ↗</a></>}
      {type === 'text'     && <Field label="Text" value={data.text} />}
      {type === 'email'    && <><Field label="To" value={data.address} /><Field label="Subject" value={data.subject} /></>}
      {type === 'phone'    && <><Field label="Phone" value={data.phone} /><a href={`tel:${data.phone}`} style={{ fontFamily: C.mono, fontSize: 11, color: C.accent }}>Call ↗</a></>}
      {type === 'wifi'     && <><Field label="SSID" value={data.ssid} /><Field label="Security" value={data.encryption} /></>}
      {type === 'vcard'    && <><Field label="Name" value={[data.firstName, data.lastName].filter(Boolean).join(' ')} /><Field label="Email" value={data.email} /></>}
      {type === 'location' && <><Field label="Lat" value={data.latitude} /><Field label="Lon" value={data.longitude} /><a href={`https://maps.google.com/?q=${data.latitude},${data.longitude}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: C.mono, fontSize: 11, color: C.accent }}>Map ↗</a></>}
      {type === 'event'    && <><Field label="Title" value={data.title} /><Field label="Start" value={data.startTime} /></>}
      <button type="button" onClick={copyRaw}
        style={{ marginTop: 10, ...outlineBtn, borderColor: C.border2, color: C.muted }}
        onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border2; }}>
        ⧉ Copy raw
      </button>
    </div>
  );
}

export function QRDecodePanel() {
  const fileInputRef = useRef(null);
  const [result,  setResult]  = useState(null);
  const [errMsg,  setErrMsg]  = useState('');

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setResult(null); setErrMsg('');
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = img.width; cv.height = img.height;
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) setResult(code.data);
        else setErrMsg('No QR code found in the image.');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function reset() { setResult(null); setErrMsg(''); if (fileInputRef.current) fileInputRef.current.value = ''; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>
        Upload an image containing a QR code to decode its contents.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border2}`,
          color: C.muted, fontFamily: C.mono, fontSize: 12, transition: 'border-color .12s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border2}>
          ↑ Upload image to scan
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} aria-label="Upload QR code image" />
        </label>
        {(result || errMsg) && (
          <button type="button" onClick={reset}
            style={{ ...outlineBtn, borderColor: C.border2, color: C.muted }}
            onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border2; }}>
            ↺ Reset
          </button>
        )}
      </div>
      {result && (
        <div style={{ background: 'rgba(108,99,255,0.04)', border: `1px solid rgba(108,99,255,0.25)`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>✓ QR decoded</div>
          <ParsedResult raw={result} />
        </div>
      )}
      {errMsg && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 14, fontFamily: C.mono, fontSize: 12, color: '#f87171' }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}
