import { useEffect, useRef, useState, useCallback } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { C, glass, primaryBtn, inputStyle } from '../constants/theme';
import { encodeQRData } from '../utils/qrDataEncoding';
import { QRScanner } from './QRScanner';
import { QRBatch } from './QRBatch';

const DOT_TYPES   = ['square','rounded','dots','classy','classy-rounded','extra-rounded'];
const CORNER_SQ   = ['square','extra-rounded','dot'];
const CORNER_DOT  = ['square','dot'];
const EC_LEVELS   = ['L','M','Q','H'];

const DATA_TYPES = [
  { id:'url',      label:'URL',      icon:'🔗' },
  { id:'text',     label:'Text',     icon:'📝' },
  { id:'email',    label:'Email',    icon:'✉' },
  { id:'phone',    label:'Phone',    icon:'📞' },
  { id:'sms',      label:'SMS',      icon:'💬' },
  { id:'wifi',     label:'WiFi',     icon:'📶' },
  { id:'vcard',    label:'Contact',  icon:'👤' },
  { id:'location', label:'Location', icon:'📍' },
  { id:'event',    label:'Event',    icon:'📅' },
];

const PRESETS = [
  { name:'Baunafier',   dotType:'rounded',        cornerSq:'extra-rounded', cornerDot:'dot',    dark:'#0a0a0a', light:'#A4F670' },
  { name:'Midnight',    dotType:'classy-rounded', cornerSq:'extra-rounded', cornerDot:'dot',    dark:'#ffffff', light:'#0a0a0a' },
  { name:'Forest',      dotType:'extra-rounded',  cornerSq:'extra-rounded', cornerDot:'square', dark:'#1a3a2a', light:'#c8f5d0' },
  { name:'Monochrome',  dotType:'square',         cornerSq:'square',        cornerDot:'square', dark:'#000000', light:'#ffffff' },
  { name:'Dots',        dotType:'dots',           cornerSq:'dot',           cornerDot:'dot',    dark:'#222222', light:'#f5f5f5' },
  { name:'Classy Dark', dotType:'classy',         cornerSq:'square',        cornerDot:'square', dark:'#8b5cf6', light:'#0d0d0d' },
];

const TABS       = ['Create','Scan','Batch'];
const STORAGE_KEY = 'qr-config-v1';

const DEFAULTS = {
  dataType:'url', dataValues:{url:''},
  dotType:'rounded', cornerSq:'extra-rounded', cornerDot:'dot',
  dark:'#0a0a0a', light:'#A4F670', ecLevel:'M',
  logoDataUrl:null, frameTop:'', frameBottom:'', size:280,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>{children}</div>;
}

function Pill({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {options.map(o => (
        <button key={o} type="button" aria-pressed={value===o} onClick={() => onChange(o)} style={{
          padding:'4px 12px', borderRadius:20, cursor:'pointer', fontFamily:C.mono, fontSize:11, transition:'all .12s',
          background:value===o?C.accent:'rgba(255,255,255,0.04)', color:value===o?'#000':C.muted,
          border:`1px solid ${value===o?C.accent:C.border2}`, fontWeight:value===o?700:400,
        }}>{o}</button>
      ))}
    </div>
  );
}

function FieldInput({ label, ...props }) {
  return (
    <label style={{ display:'block' }}>
      <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <input {...props} style={{ ...inputStyle, marginBottom:8, fontSize:13, ...(props.style||{}) }}
        onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow='0 0 0 3px rgba(164,246,112,0.06)';}}
        onBlur={e=>{e.target.style.borderColor=C.border2;e.target.style.boxShadow='none';}} />
    </label>
  );
}

function DataForm({ type, values, onChange }) {
  const set = k => e => onChange({ ...values, [k]: e.target.value });
  const setB = k => e => onChange({ ...values, [k]: e.target.checked });
  if (type === 'url')      return <FieldInput label="URL" type="url" value={values.url||''} onChange={set('url')} placeholder="https://example.com" />;
  if (type === 'text')     return (
    <label style={{ display:'block' }}>
      <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>Text</div>
      <textarea value={values.text||''} onChange={set('text')} placeholder="Any text…" rows={4} style={{ ...inputStyle, resize:'vertical', fontSize:13, marginBottom:8 }}
        onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow='0 0 0 3px rgba(164,246,112,0.06)';}}
        onBlur={e=>{e.target.style.borderColor=C.border2;e.target.style.boxShadow='none';}} />
    </label>
  );
  if (type === 'email')    return <><FieldInput label="Email address" type="email" value={values.address||''} onChange={set('address')} placeholder="user@example.com" /><FieldInput label="Subject (optional)" value={values.subject||''} onChange={set('subject')} placeholder="Hello" /><FieldInput label="Body (optional)" value={values.body||''} onChange={set('body')} placeholder="…" /></>;
  if (type === 'phone')    return <FieldInput label="Phone number" type="tel" value={values.phone||''} onChange={set('phone')} placeholder="+1 555 000 0000" />;
  if (type === 'sms')      return <><FieldInput label="Phone number" type="tel" value={values.phone||''} onChange={set('phone')} placeholder="+1 555 000 0000" /><FieldInput label="Message (optional)" value={values.message||''} onChange={set('message')} placeholder="Hey!" /></>;
  if (type === 'wifi')     return <>
    <FieldInput label="Network name (SSID)" value={values.ssid||''} onChange={set('ssid')} placeholder="MyWiFi" />
    <div style={{ marginBottom:8 }}><Label>Security</Label><Pill label="WiFi security" options={['WPA','WEP','nopass']} value={values.encryption||'WPA'} onChange={v => onChange({...values, encryption:v})} /></div>
    {(values.encryption||'WPA') !== 'nopass' && <FieldInput label="Password" type="password" value={values.password||''} onChange={set('password')} placeholder="••••••••" />}
    <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:C.mono, fontSize:12, color:C.muted, cursor:'pointer', marginBottom:8 }}>
      <input type="checkbox" checked={!!values.hidden} onChange={setB('hidden')} style={{ accentColor:C.accent }} /> Hidden network
    </label>
  </>;
  if (type === 'vcard')    return <>
    <div style={{ display:'flex', gap:8 }}>
      <FieldInput label="First name" value={values.firstName||''} onChange={set('firstName')} placeholder="Jane" style={{ flex:1 }} />
      <FieldInput label="Last name" value={values.lastName||''} onChange={set('lastName')} placeholder="Doe" style={{ flex:1 }} />
    </div>
    <FieldInput label="Organization" value={values.org||''} onChange={set('org')} placeholder="Acme Corp" />
    <FieldInput label="Job title" value={values.position||''} onChange={set('position')} placeholder="Designer" />
    <FieldInput label="Mobile" type="tel" value={values.phoneMobile||''} onChange={set('phoneMobile')} placeholder="+1 555 000 0000" />
    <FieldInput label="Work phone" type="tel" value={values.phoneWork||''} onChange={set('phoneWork')} placeholder="+1 555 000 0001" />
    <FieldInput label="Email" type="email" value={values.email||''} onChange={set('email')} placeholder="jane@example.com" />
    <FieldInput label="Website" type="url" value={values.website||''} onChange={set('website')} placeholder="https://…" />
    <div style={{ display:'flex', gap:8 }}>
      <FieldInput label="City" value={values.city||''} onChange={set('city')} placeholder="New York" style={{ flex:1 }} />
      <FieldInput label="Country" value={values.country||''} onChange={set('country')} placeholder="USA" style={{ flex:1 }} />
    </div>
  </>;
  if (type === 'location') return <>
    <FieldInput label="Latitude" type="number" step="any" value={values.latitude||''} onChange={set('latitude')} placeholder="48.8566" />
    <FieldInput label="Longitude" type="number" step="any" value={values.longitude||''} onChange={set('longitude')} placeholder="2.3522" />
  </>;
  if (type === 'event')    return <>
    <FieldInput label="Event title" value={values.title||''} onChange={set('title')} placeholder="Team meeting" />
    <FieldInput label="Location" value={values.location||''} onChange={set('location')} placeholder="Conference room A" />
    <FieldInput label="Start" type="datetime-local" value={values.startTime||''} onChange={set('startTime')} />
    <FieldInput label="End"   type="datetime-local" value={values.endTime||''}   onChange={set('endTime')} />
  </>;
  return null;
}

async function renderFramed(qrInstance, topText, bottomText, size) {
  const hasFrame = topText || bottomText;
  if (!hasFrame) return null;
  const PAD = 40;
  const totalH = size + (topText ? PAD : 0) + (bottomText ? PAD : 0);
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = totalH;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, totalH);
  const blob = await qrInstance.getRawData('png');
  const url = URL.createObjectURL(blob);
  await new Promise(res => {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, topText ? PAD : 0, size, size); URL.revokeObjectURL(url); res(); };
    img.src = url;
  });
  ctx.font = 'bold 18px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0a0a0a';
  if (topText)    ctx.fillText(topText,    size/2, 28);
  if (bottomText) ctx.fillText(bottomText, size/2, size + (topText?PAD:0) + 28);
  return cv;
}

export function QRCodeModal({ url: initialUrl, onClose }) {
  const previewRef = useRef(null);
  const qrRef     = useRef(null);
  const [activeTab, setActiveTab] = useState('Create');

  const loadSaved = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }, []);

  const saved = loadSaved();
  const [dataType,    setDataType]    = useState(saved.dataType    || DEFAULTS.dataType);
  const [dataValues,  setDataValues]  = useState(() => {
    const dt = saved.dataType || DEFAULTS.dataType;
    return saved.dataValues || (dt === 'url' ? { url: initialUrl || '' } : DEFAULTS.dataValues);
  });
  const [dotType,     setDotType]     = useState(saved.dotType     || DEFAULTS.dotType);
  const [cornerSq,    setCornerSq]    = useState(saved.cornerSq    || DEFAULTS.cornerSq);
  const [cornerDot,   setCornerDot]   = useState(saved.cornerDot   || DEFAULTS.cornerDot);
  const [dark,        setDark]        = useState(saved.dark        || DEFAULTS.dark);
  const [light,       setLight]       = useState(saved.light       || DEFAULTS.light);
  const [ecLevel,     setEcLevel]     = useState(saved.ecLevel     || DEFAULTS.ecLevel);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [frameTop,    setFrameTop]    = useState(saved.frameTop    || DEFAULTS.frameTop);
  const [frameBottom, setFrameBottom] = useState(saved.frameBottom || DEFAULTS.frameBottom);
  const [copying,     setCopying]     = useState(false);
  const [saveMsg,     setSaveMsg]     = useState('');

  const qrData = encodeQRData(dataType, dataValues) || initialUrl || 'https://baunafier.qzz.io';

  useEffect(() => {
    if (!previewRef.current || activeTab !== 'Create') return;
    const opts = {
      width: DEFAULTS.size, height: DEFAULTS.size, type: 'canvas', data: qrData,
      dotsOptions:          { type: dotType,    color: dark },
      cornersSquareOptions: { type: cornerSq,   color: dark },
      cornersDotOptions:    { type: cornerDot,  color: dark },
      backgroundOptions:    { color: light },
      errorCorrectionLevel: ecLevel,
      ...(logoDataUrl ? { imageOptions:{ crossOrigin:'anonymous', margin:4, imageSize:0.3 }, image: logoDataUrl } : {}),
    };
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(opts);
      qrRef.current.append(previewRef.current);
    } else {
      qrRef.current.update(opts);
    }
  }, [qrData, dotType, cornerSq, cornerDot, dark, light, ecLevel, logoDataUrl, activeTab]);

  useEffect(() => () => { qrRef.current = null; }, []);

  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dataType, dataValues, dotType, cornerSq, cornerDot, dark, light, ecLevel, frameTop, frameBottom }));
    setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 1500);
  }
  function loadConfig() {
    const s = loadSaved();
    if (!s.dotType) { setSaveMsg('Nothing saved yet.'); setTimeout(() => setSaveMsg(''), 1500); return; }
    if (s.dataType)    setDataType(s.dataType);
    if (s.dataValues)  setDataValues(s.dataValues);
    if (s.dotType)     setDotType(s.dotType);
    if (s.cornerSq)    setCornerSq(s.cornerSq);
    if (s.cornerDot)   setCornerDot(s.cornerDot);
    if (s.dark)        setDark(s.dark);
    if (s.light)       setLight(s.light);
    if (s.ecLevel)     setEcLevel(s.ecLevel);
    if (s.frameTop    != null) setFrameTop(s.frameTop);
    if (s.frameBottom != null) setFrameBottom(s.frameBottom);
    setSaveMsg('Loaded!'); setTimeout(() => setSaveMsg(''), 1500);
  }
  function applyPreset(p) { setDotType(p.dotType); setCornerSq(p.cornerSq); setCornerDot(p.cornerDot); setDark(p.dark); setLight(p.light); }
  function swapColors() { const tmp = dark; setDark(light); setLight(tmp); }

  const fileName = `qr-${(qrData||'').replace(/^https?:\/\//,'').replace(/[^a-z0-9]/gi,'-').slice(0,40)}`;

  async function download(ext) {
    if (!qrRef.current) return;
    if ((frameTop || frameBottom) && ext !== 'svg') {
      const cv = await renderFramed(qrRef.current, frameTop, frameBottom, DEFAULTS.size);
      if (cv) {
        const mime = ext === 'jpg' ? 'image/jpeg' : 'image/png';
        const a = document.createElement('a');
        a.href = cv.toDataURL(mime, 0.92);
        a.download = `${fileName}.${ext}`;
        a.click(); return;
      }
    }
    qrRef.current.download({ name: fileName, extension: ext });
  }

  async function copyToClipboard() {
    try { setCopying(true); const blob = await qrRef.current?.getRawData('png'); if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); }
    catch { /* clipboard unavailable */ } finally { setCopying(false); }
  }

  const handleLogoUpload = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setLogoDataUrl(ev.target.result); r.readAsDataURL(f);
  }, []);

  function onBackdrop(e) { if (e.target === e.currentTarget) onClose(); }

  const tabStyle = t => ({
    background: activeTab===t ? 'rgba(164,246,112,0.1)' : 'none',
    color: activeTab===t ? C.accent : C.muted,
    border: `1px solid ${activeTab===t ? C.accent : C.border2}`,
    borderRadius:7, padding:'5px 18px', fontFamily:C.mono, fontSize:11,
    cursor:'pointer', fontWeight:activeTab===t?700:400, transition:'all .12s',
  });
  const outlineBtn = {
    background:'none', border:`1px solid ${C.border2}`, borderRadius:7,
    color:C.muted, fontFamily:C.mono, fontSize:11, cursor:'pointer',
    padding:'5px 12px', transition:'color .12s, border-color .12s',
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="QR Code Generator" onClick={onBackdrop}
      style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0,0,0,0.8)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div style={{ ...glass, borderRadius:16, width:'100%', maxWidth:760, maxHeight:'92vh',
          overflowY:'auto', display:'flex', flexDirection:'column', animation:'fadeUp .2s ease', padding:'24px 24px 20px' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ fontFamily:C.display, fontStyle:'italic', fontSize:22, color:C.text, lineHeight:1 }}>QR Code</h2>
          <button type="button" onClick={onClose} aria-label="Close QR modal"
            style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontFamily:C.mono, fontSize:18, lineHeight:1, padding:0 }}>✕</button>
        </div>

        {/* Tabs */}
        <div role="tablist" style={{ display:'flex', gap:8, marginBottom:20 }}>
          {TABS.map(t => (
            <button key={t} role="tab" aria-selected={activeTab===t} type="button" onClick={() => setActiveTab(t)} style={tabStyle(t)}>
              {t==='Create'?'✦ ':t==='Scan'?'⊙ ':'⊞ '}{t}
            </button>
          ))}
        </div>

        {/* ═══ CREATE ═══ */}
        {activeTab === 'Create' && (
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {/* LEFT */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, flexShrink:0 }}>
              <div ref={previewRef} style={{ borderRadius:12, overflow:'hidden', width:DEFAULTS.size, height:DEFAULTS.size,
                flexShrink:0, border:'1px solid rgba(164,246,112,0.15)' }} />
              <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, wordBreak:'break-all', textAlign:'center', maxWidth:DEFAULTS.size }}>
                {qrData.slice(0,80)}{qrData.length>80?'…':''}
              </div>
              {/* Export */}
              <div role="group" aria-label="Export options" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, width:'100%' }}>
                {['PNG','JPG','SVG'].map(ext => (
                  <button key={ext} type="button" onClick={() => download(ext.toLowerCase())} aria-label={`Download ${ext}`}
                    style={{ ...primaryBtn, padding:'8px 0', fontSize:11 }}
                    onMouseEnter={e=>{e.currentTarget.style.opacity='.88';e.currentTarget.style.boxShadow='0 0 16px rgba(164,246,112,0.35)';}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.boxShadow='none';}}>
                    ↓ {ext}
                  </button>
                ))}
                <button type="button" onClick={copyToClipboard} aria-label="Copy QR code to clipboard"
                  style={{ ...outlineBtn, fontSize:11, padding:'8px 0', textAlign:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                  {copying?'…':'⧉ Copy'}
                </button>
              </div>
              {/* Save / Load */}
              <div style={{ display:'flex', gap:6, width:'100%' }}>
                <button type="button" onClick={saveConfig} style={{ ...outlineBtn, flex:1, textAlign:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.borderColor=C.accent;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                  💾 Save config
                </button>
                <button type="button" onClick={loadConfig} style={{ ...outlineBtn, flex:1, textAlign:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                  ↺ Load
                </button>
              </div>
              {saveMsg && <div role="status" style={{ fontFamily:C.mono, fontSize:11, color:C.accent, textAlign:'center' }}>{saveMsg}</div>}
            </div>

            {/* RIGHT */}
            <div style={{ flex:1, minWidth:260, display:'flex', flexDirection:'column', gap:16 }}>
              {/* Data type */}
              <div>
                <Label>Data type</Label>
                <div role="group" aria-label="QR data type" style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                  {DATA_TYPES.map(dt => (
                    <button key={dt.id} type="button" aria-pressed={dataType===dt.id}
                      onClick={() => { setDataType(dt.id); setDataValues({}); }}
                      style={{
                        padding:'4px 10px', borderRadius:20, cursor:'pointer', fontFamily:C.mono, fontSize:11, transition:'all .12s',
                        background:dataType===dt.id?C.accent:'rgba(255,255,255,0.04)',
                        color:dataType===dt.id?'#000':C.muted,
                        border:`1px solid ${dataType===dt.id?C.accent:C.border2}`,
                        fontWeight:dataType===dt.id?700:400,
                      }}>
                      {dt.icon} {dt.label}
                    </button>
                  ))}
                </div>
                <DataForm type={dataType} values={dataValues} onChange={setDataValues} />
              </div>

              {/* Presets */}
              <details>
                <summary style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', marginBottom:8, listStyle:'none' }}>▶ Presets</summary>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                  {PRESETS.map(p => (
                    <button key={p.name} type="button" onClick={() => applyPreset(p)} aria-label={`Apply ${p.name} preset`}
                      style={{ ...outlineBtn, padding:'5px 12px', background:`linear-gradient(135deg, ${p.dark} 50%, ${p.light} 50%)`, border:`1px solid ${C.border2}`, color:C.text, fontSize:10 }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;}}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </details>

              {/* Style pills */}
              <div><Label>Dot style</Label><Pill label="Dot style" options={DOT_TYPES} value={dotType} onChange={setDotType} /></div>
              <div><Label>Corner squares</Label><Pill label="Corner squares" options={CORNER_SQ} value={cornerSq} onChange={setCornerSq} /></div>
              <div><Label>Corner dots</Label><Pill label="Corner dots" options={CORNER_DOT} value={cornerDot} onChange={setCornerDot} /></div>
              <div>
                <Label>Error correction</Label>
                <Pill label="Error correction" options={EC_LEVELS} value={ecLevel} onChange={setEcLevel} />
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginTop:4 }}>L=7% · M=15% · Q=25% · H=30% recovery</div>
              </div>

              {/* Colors */}
              <div>
                <Label>Colors</Label>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                    <input type="color" value={dark} onChange={e=>setDark(e.target.value)} aria-label="Foreground color"
                      style={{ width:32, height:26, border:`1px solid ${C.border2}`, borderRadius:5, cursor:'pointer', background:'none', padding:2 }} />
                    <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>FG {dark}</span>
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                    <input type="color" value={light} onChange={e=>setLight(e.target.value)} aria-label="Background color"
                      style={{ width:32, height:26, border:`1px solid ${C.border2}`, borderRadius:5, cursor:'pointer', background:'none', padding:2 }} />
                    <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>BG {light}</span>
                  </label>
                  <button type="button" onClick={swapColors} aria-label="Swap foreground and background colors"
                    style={{ ...outlineBtn, fontSize:11 }}
                    onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
                    onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                    ⇄ Swap
                  </button>
                </div>
              </div>

              {/* Logo */}
              <div>
                <Label>Logo overlay</Label>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:7, cursor:'pointer',
                    background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border2}`,
                    color:C.muted, fontFamily:C.mono, fontSize:11, transition:'border-color .12s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border2}>
                    ↑ Upload
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:'none' }} aria-label="Upload logo image" />
                  </label>
                  {logoDataUrl && <>
                    <img src={logoDataUrl} alt="Logo preview" style={{ width:26, height:26, objectFit:'contain', borderRadius:4, border:`1px solid ${C.border2}` }} />
                    <button type="button" onClick={() => setLogoDataUrl(null)} aria-label="Remove logo"
                      style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontFamily:C.mono, fontSize:11 }}>✕</button>
                  </>}
                </div>
              </div>

              {/* Frame */}
              <div>
                <Label>Frame labels</Label>
                <FieldInput label="Top text" value={frameTop} onChange={e => setFrameTop(e.target.value)} placeholder="Scan me!" />
                <FieldInput label="Bottom text" value={frameBottom} onChange={e => setFrameBottom(e.target.value)} placeholder="baunafier.qzz.io" />
                {(frameTop||frameBottom) && <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>Frame text appears on PNG/JPG exports only.</div>}
              </div>

              {/* Reset */}
              <button type="button" aria-label="Reset to default settings"
                onClick={() => {
                  setDataType(DEFAULTS.dataType); setDataValues({ url: initialUrl||'' });
                  setDotType(DEFAULTS.dotType); setCornerSq(DEFAULTS.cornerSq); setCornerDot(DEFAULTS.cornerDot);
                  setDark(DEFAULTS.dark); setLight(DEFAULTS.light); setEcLevel(DEFAULTS.ecLevel);
                  setLogoDataUrl(null); setFrameTop(''); setFrameBottom('');
                }}
                style={{ ...outlineBtn, alignSelf:'flex-start' }}
                onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
                onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                ↺ Reset defaults
              </button>
            </div>
          </div>
        )}

        {/* ═══ SCAN ═══ */}
        {activeTab === 'Scan' && <QRScanner />}

        {/* ═══ BATCH ═══ */}
        {activeTab === 'Batch' && (
          <QRBatch baseOptions={{ dotType, cornerSq, cornerDot, dark, light, ecLevel }} logoDataUrl={logoDataUrl} />
        )}
      </div>
    </div>
  );
}
