import { useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import JSZip from 'jszip';
import { C, primaryBtn, inputStyle } from '../constants/theme';

const SAMPLE_CSV = `https://baunafier.qzz.io
https://github.com
https://example.com`;

const outlineBtn = {
  background:'none', border:`1px solid`, borderRadius:7,
  fontFamily: 'inherit', fontSize:11, cursor:'pointer',
  padding:'7px 16px', transition:'color .12s, border-color .12s',
};

export function QRBatch({ baseOptions = {}, logoDataUrl = null }) {
  const fileInputRef = useRef(null);
  const [rows,     setRows]     = useState([]);
  const [progress, setProgress] = useState(null); // null | { done, total }
  const [errMsg,   setErrMsg]   = useState('');
  const [size,     setSize]     = useState(300);

  function parseCsv(text) {
    return text
      .split('\n')
      .map(l => l.trim().split(',')[0].trim())
      .filter(Boolean);
  }

  function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setErrMsg('');
    const reader = new FileReader();
    reader.onload = ev => {
      const items = parseCsv(ev.target.result);
      if (items.length === 0) { setErrMsg('No data found in CSV.'); return; }
      if (items.length > 500) { setErrMsg('Maximum 500 rows per batch.'); return; }
      setRows(items);
    };
    reader.readAsText(file);
  }

  function handlePaste(e) {
    const items = parseCsv(e.target.value);
    setRows(items);
    setErrMsg('');
  }

  async function generateZip() {
    if (rows.length === 0) { setErrMsg('No data to generate.'); return; }
    setProgress({ done: 0, total: rows.length });
    setErrMsg('');

    const zip = new JSZip();
    const folder = zip.folder('qr-codes');

    for (let i = 0; i < rows.length; i++) {
      const data = rows[i];
      const qr = new QRCodeStyling({
        width: size, height: size, type: 'canvas', data,
        dotsOptions:          { type: baseOptions.dotType    || 'rounded',        color: baseOptions.dark    || '#0a0a0a' },
        cornersSquareOptions: { type: baseOptions.cornerSq   || 'extra-rounded',  color: baseOptions.dark    || '#0a0a0a' },
        cornersDotOptions:    { type: baseOptions.cornerDot  || 'dot',            color: baseOptions.dark    || '#0a0a0a' },
        backgroundOptions:    { color: baseOptions.light     || '#A4F670' },
        errorCorrectionLevel: baseOptions.ecLevel || 'M',
        ...(logoDataUrl ? { imageOptions:{ crossOrigin:'anonymous', margin:4, imageSize:0.3 }, image: logoDataUrl } : {}),
      });

      try {
        const blob = await qr.getRawData('png');
        const num  = String(i + 1).padStart(3, '0');
        folder.file(`qr-${num}.png`, blob);
      } catch (err) {
        console.warn('Failed to generate QR for:', data, err);
      }

      setProgress({ done: i + 1, total: rows.length });
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob', compression:'DEFLATE', compressionOptions:{ level: 6 } });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `qr-batch-${rows.length}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setErrMsg('Failed to create ZIP: ' + err.message);
    }

    setProgress(null);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'4px 0' }}>
      <p style={{ fontFamily:C.mono, fontSize:12, color:C.muted, lineHeight:1.6, margin:0 }}>
        Generate QR codes in bulk. Upload a CSV or paste data — one URL/value per line (first column used if multiple columns).
      </p>

      {/* Input */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:8, cursor:'pointer',
          background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border2}`,
          color:C.muted, fontFamily:C.mono, fontSize:12, transition:'border-color .12s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border2}>
          ↑ Upload CSV
          <input ref={fileInputRef} type="file" accept=".csv,text/csv,text/plain" onChange={handleFile}
            style={{ display:'none' }} aria-label="Upload CSV file" />
        </label>
        <span style={{ fontFamily:C.mono, fontSize:11, color:C.muted }}>or paste below</span>
      </div>

      {/* Paste area */}
      <label style={{ display:'block' }}>
        <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
          Data (one per line)
        </div>
        <textarea
          placeholder={SAMPLE_CSV}
          rows={6}
          onChange={handlePaste}
          style={{ ...inputStyle, resize:'vertical', fontSize:12, fontFamily:C.mono }}
          onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow='0 0 0 3px rgba(164,246,112,0.06)';}}
          onBlur={e=>{e.target.style.borderColor=C.border2;e.target.style.boxShadow='none';}}
          aria-label="Paste QR data"
        />
      </label>

      {/* Size */}
      <label style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
          QR size: {size}px
        </div>
        <input type="range" min={100} max={1000} step={50} value={size} onChange={e => setSize(Number(e.target.value))}
          style={{ flex:1, accentColor:C.accent }} aria-label="QR code size in pixels" />
      </label>

      {/* Row preview */}
      {rows.length > 0 && (
        <div>
          <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
            {rows.length} item{rows.length !== 1 ? 's' : ''} — preview
          </div>
          <div style={{ maxHeight:140, overflowY:'auto', background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border2}`, borderRadius:8, padding:'8px 12px' }}>
            {rows.slice(0,50).map((r, i) => (
              <div key={i} style={{ fontFamily:C.mono, fontSize:11, color:C.muted, padding:'2px 0', borderBottom:i<rows.length-1?`1px solid ${C.border2}40`:'none', wordBreak:'break-all' }}>
                <span style={{ color:C.accent, marginRight:8 }}>{String(i+1).padStart(3,'0')}</span>{r}
              </div>
            ))}
            {rows.length > 50 && <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, paddingTop:6 }}>…and {rows.length-50} more</div>}
          </div>
        </div>
      )}

      {/* Generate */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <button type="button" onClick={generateZip}
          disabled={rows.length === 0 || progress !== null}
          style={{ ...primaryBtn, padding:'10px 24px', fontSize:12, opacity:(rows.length===0||progress)?0.5:1 }}
          onMouseEnter={e=>{if(rows.length>0&&!progress){e.currentTarget.style.opacity='.88';e.currentTarget.style.boxShadow='0 0 16px rgba(164,246,112,0.35)';}}}
          onMouseLeave={e=>{e.currentTarget.style.opacity=(rows.length===0||progress)?'0.5':'1';e.currentTarget.style.boxShadow='none';}}>
          ⊞ Generate &amp; Download ZIP
        </button>
        {rows.length > 0 && !progress && (
          <button type="button" onClick={() => { setRows([]); if(fileInputRef.current) fileInputRef.current.value=''; }}
            style={{ ...outlineBtn, borderColor:C.border2, color:C.muted }}
            onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
            onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Progress */}
      {progress && (
        <div>
          <div style={{ fontFamily:C.mono, fontSize:11, color:C.muted, marginBottom:6 }}>
            Generating {progress.done} / {progress.total}…
          </div>
          <div style={{ height:6, background:`rgba(255,255,255,0.08)`, borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', background:C.accent, borderRadius:3, width:`${(progress.done/progress.total)*100}%`, transition:'width .1s' }} />
          </div>
        </div>
      )}

      {/* Error */}
      {errMsg && (
        <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:14,
          fontFamily:C.mono, fontSize:12, color:'#f87171' }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}
