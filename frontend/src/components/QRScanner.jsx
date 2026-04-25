import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { C, glass, primaryBtn, inputStyle } from '../constants/theme';
import { detectDataType } from '../utils/qrDataEncoding';

const outlineBtn = {
  background:'none', border:`1px solid`, borderRadius:7,
  fontFamily: (typeof C !== 'undefined' ? C.mono : 'monospace'), fontSize:11, cursor:'pointer',
  padding:'7px 16px', transition:'color .12s, border-color .12s',
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom:6 }}>
      <span style={{ fontFamily:'var(--font-mono, monospace)', fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label} </span>
      <span style={{ fontFamily:'var(--font-mono, monospace)', fontSize:13, color:'#f1f5f9', wordBreak:'break-all' }}>{value}</span>
    </div>
  );
}

function ParsedResult({ raw }) {
  const parsed = detectDataType(raw);
  if (!parsed) return <div style={{ fontFamily:'var(--font-mono, monospace)', fontSize:13, color:'#f1f5f9', wordBreak:'break-all' }}>{raw}</div>;

  const { type, data } = parsed;

  const copyRaw = async () => {
    try { await navigator.clipboard.writeText(raw); } catch {}
  };

  return (
    <div>
      <div style={{ fontFamily:'var(--font-mono, monospace)', fontSize:10, color:C.accent, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
        Detected: {type}
      </div>
      {type === 'url'      && <><Field label="URL" value={data.url} /><a href={data.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily:C.mono, fontSize:11, color:C.accent }}>Open link ↗</a></>}
      {type === 'text'     && <Field label="Text" value={data.text} />}
      {type === 'email'    && <><Field label="To" value={data.address} /><Field label="Subject" value={data.subject} /><Field label="Body" value={data.body} /></>}
      {type === 'phone'    && <><Field label="Phone" value={data.phone} /><a href={`tel:${data.phone}`} style={{ fontFamily:C.mono, fontSize:11, color:C.accent }}>Call ↗</a></>}
      {type === 'sms'      && <><Field label="Phone" value={data.phone} /><Field label="Message" value={data.message} /></>}
      {type === 'wifi'     && <><Field label="SSID" value={data.ssid} /><Field label="Security" value={data.encryption} /><Field label="Password" value={data.password} /></>}
      {type === 'vcard'    && <><Field label="Name" value={[data.firstName, data.lastName].filter(Boolean).join(' ')} /><Field label="Org" value={data.org} /><Field label="Phone" value={data.phoneMobile || data.phoneWork} /><Field label="Email" value={data.email} /><Field label="Website" value={data.website} /></>}
      {type === 'location' && <><Field label="Lat" value={data.latitude} /><Field label="Lon" value={data.longitude} /><a href={`https://maps.google.com/?q=${data.latitude},${data.longitude}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:C.mono, fontSize:11, color:C.accent }}>Open map ↗</a></>}
      {type === 'event'    && <><Field label="Title" value={data.title} /><Field label="Location" value={data.location} /><Field label="Start" value={data.startTime} /><Field label="End" value={data.endTime} /></>}
      <button type="button" onClick={copyRaw} style={{ marginTop:10, ...outlineBtn, borderColor:C.border2, color:C.muted }}
        onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
        ⧉ Copy raw data
      </button>
    </div>
  );
}

export function QRScanner() {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const fileInputRef = useRef(null);

  const [mode,    setMode]    = useState('idle'); // idle | camera | done | error
  const [result,  setResult]  = useState(null);
  const [errMsg,  setErrMsg]  = useState('');
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function startCamera() {
    setResult(null); setErrMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode('camera'); setScanning(true);
      scanLoop();
    } catch (e) {
      setErrMsg(`Camera error: ${e.message}`);
      setMode('error');
    }
  }

  function scanLoop() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (canvas.width > 0 && canvas.height > 0) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        stopCamera();
        setResult(code.data);
        setMode('done');
        return;
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null); setErrMsg('');
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) { setResult(code.data); setMode('done'); }
        else { setErrMsg('No QR code found in image.'); setMode('error'); }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function reset() {
    stopCamera(); setResult(null); setErrMsg(''); setMode('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'4px 0' }}>
      <p style={{ fontFamily:C.mono, fontSize:12, color:C.muted, lineHeight:1.6, margin:0 }}>
        Scan a QR code using your camera or upload an image file.
      </p>

      {/* Controls */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button type="button" onClick={startCamera} disabled={mode==='camera'}
          style={{ ...primaryBtn, padding:'9px 20px', fontSize:12, opacity:mode==='camera'?0.5:1 }}
          onMouseEnter={e=>{if(mode!=='camera'){e.currentTarget.style.opacity='.88';e.currentTarget.style.boxShadow='0 0 16px rgba(108,99,255,0.35)';}}}  
          onMouseLeave={e=>{e.currentTarget.style.opacity=mode==='camera'?'0.5':'1';e.currentTarget.style.boxShadow='none';}}>
          ⊙ Start camera
        </button>
        <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:8, cursor:'pointer',
          background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border2}`,
          color:C.muted, fontFamily:C.mono, fontSize:12, transition:'border-color .12s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border2}>
          ↑ Upload image
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display:'none' }} aria-label="Upload QR code image" />
        </label>
        {mode !== 'idle' && (
          <button type="button" onClick={reset} style={{ ...outlineBtn, borderColor:C.border2, color:C.muted }}
            onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
            onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
            ↺ Reset
          </button>
        )}
      </div>

      {/* Camera view */}
      {mode === 'camera' && (
        <div style={{ position:'relative', borderRadius:12, overflow:'hidden', maxWidth:380, border:`1px solid ${C.border2}` }}>
          <video ref={videoRef} muted playsInline style={{ width:'100%', display:'block' }} aria-label="Camera viewfinder" />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ width:180, height:180, border:`2px solid ${C.accent}`, borderRadius:12, opacity:0.7, boxShadow:`0 0 30px ${C.accent}40` }} />
          </div>
          {scanning && <div style={{ position:'absolute', bottom:10, left:0, right:0, textAlign:'center', fontFamily:C.mono, fontSize:10, color:C.accent }}>Scanning…</div>}
        </div>
      )}

      {/* Hidden canvas used for image analysis */}
      <canvas ref={canvasRef} style={{ display:'none' }} />

      {/* Result */}
      {mode === 'done' && result && (
        <div style={{ background:'rgba(108,99,255,0.04)', border:`1px solid ${C.accent}40`, borderRadius:12, padding:16 }}>
          <div style={{ fontFamily:C.mono, fontSize:10, color:C.accent, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>✓ QR detected</div>
          <ParsedResult raw={result} />
        </div>
      )}

      {/* Error */}
      {mode === 'error' && errMsg && (
        <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:14,
          fontFamily:C.mono, fontSize:12, color:'#f87171' }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}
