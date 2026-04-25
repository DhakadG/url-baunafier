import { useEffect, useRef, useState, useCallback } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { C, glass, primaryBtn, inputStyle } from '../constants/theme';
import { encodeQRData } from '../utils/qrDataEncoding';

const PREVIEW_SIZE  = 280;
const EXPORT_SIZES  = [300, 512, 1024, 2048];

const DOT_SHAPES = [
  { id:'square',         label:'Blocks' },
  { id:'rounded',        label:'Smooth' },
  { id:'dots',           label:'Circles' },
  { id:'classy',         label:'Diamond' },
  { id:'classy-rounded', label:'D.Smooth' },
  { id:'extra-rounded',  label:'Bubbles' },
];
const CORNER_SQ   = ['square','extra-rounded','dot'];
const CORNER_DOT  = ['square','dot'];
const EC_LEVELS   = ['L','M','Q','H'];

const FONT_OPTIONS = [
  { id:"'DM Mono', monospace",               label:'DM Mono' },
  { id:"'Space Grotesk', sans-serif",        label:'Space Grotesk' },
  { id:"'Instrument Serif', Georgia, serif", label:'Serif' },
  { id:'Arial, sans-serif',                  label:'Arial' },
];

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
  { name:'Baunafier',   dotType:'rounded',        cornerSq:'extra-rounded', cornerDot:'dot',    dark:'#07060f', light:'#6C63FF' },
  { name:'Midnight',    dotType:'classy-rounded', cornerSq:'extra-rounded', cornerDot:'dot',    dark:'#ffffff', light:'#0a0a0a' },
  { name:'Forest',      dotType:'extra-rounded',  cornerSq:'extra-rounded', cornerDot:'square', dark:'#1a3a2a', light:'#c8f5d0' },
  { name:'Monochrome',  dotType:'square',         cornerSq:'square',        cornerDot:'square', dark:'#000000', light:'#ffffff' },
  { name:'Dots',        dotType:'dots',           cornerSq:'dot',           cornerDot:'dot',    dark:'#222222', light:'#f5f5f5' },
  { name:'Classy Dark', dotType:'classy',         cornerSq:'square',        cornerDot:'square', dark:'#8b5cf6', light:'#0d0d0d' },
  { name:'Crimson',     dotType:'classy-rounded', cornerSq:'extra-rounded', cornerDot:'dot',    dark:'#c41e3a', light:'#fff5f5' },
  { name:'Ocean',       dotType:'extra-rounded',  cornerSq:'extra-rounded', cornerDot:'dot',    dark:'#0a4a6e', light:'#e8f6ff' },
  { name:'Sunset',      dotType:'rounded',        cornerSq:'extra-rounded', cornerDot:'dot',    dark:'#c2410c', light:'#fff7ed' },
];

const TABS       = ['Create'];
const STORAGE_KEY = 'qr-config-v1';

const DEFAULTS = {
  dataType:'url', dataValues:{url:''},
  dotType:'rounded', cornerSq:'extra-rounded', cornerDot:'dot',
  dark:'#07060f', light:'#6C63FF', ecLevel:'M',
  logoDataUrl:null,
  dotFill:'solid', gradientType:'linear', gradientAngle:45,
  gradientColor1:'#07060f', gradientColor2:'#6C63FF',
  frameTop:'', frameBottom:'',
  frameTextColor:'#0a0a0a', frameBgColor:'#ffffff',
  frameBorderColor:'#cccccc', frameBorderWidth:0,
  frameBorderRadius:8, framePadding:32,
  frameFontFamily:"'DM Mono', monospace",
  exportSize:512, jpgQuality:0.92,
  size:280,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>{children}</div>;
}

function Pill({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {options.map(o => {
        const id  = typeof o === 'string' ? o : o.id;
        const lbl = typeof o === 'string' ? o : o.label;
        return (
          <button key={id} type="button" aria-pressed={value===id} onClick={() => onChange(id)} style={{
            padding:'4px 12px', borderRadius:20, cursor:'pointer', fontFamily:C.mono, fontSize:11, transition:'all .12s',
            background:value===id?C.accent:'rgba(255,255,255,0.04)', color:value===id?'#000':C.muted,
            border:`1px solid ${value===id?C.accent:C.border2}`, fontWeight:value===id?700:400,
          }}>{lbl}</button>
        );
      })}
    </div>
  );
}

function FieldInput({ label, ...props }) {
  return (
    <label style={{ display:'block' }}>
      <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <input {...props} style={{ ...inputStyle, marginBottom:8, fontSize:13, ...(props.style||{}) }}
        onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow='0 0 0 3px rgba(108,99,255,0.12)';}}  
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
        onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow='0 0 0 3px rgba(108,99,255,0.12)';}}
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

async function renderFramed(qrInstance, { top, bottom, size, textColor, bgColor, borderColor, borderWidth, fontFamily, padding }) {
  const hasTop    = !!top;
  const hasBottom = !!bottom;
  if (!hasTop && !hasBottom) return null;
  const PAD    = Math.max(20, padding);
  const totalH = size + (hasTop ? PAD : 0) + (hasBottom ? PAD : 0);
  const cv  = document.createElement('canvas');
  cv.width  = size;
  cv.height = totalH;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bgColor || '#ffffff';
  ctx.fillRect(0, 0, size, totalH);
  const bw = Number(borderWidth) || 0;
  if (bw > 0) {
    ctx.strokeStyle = borderColor || '#cccccc';
    ctx.lineWidth   = bw;
    ctx.strokeRect(bw / 2, bw / 2, size - bw, totalH - bw);
  }
  const blob = await qrInstance.getRawData('png');
  const url  = URL.createObjectURL(blob);
  await new Promise(res => {
    const img  = new Image();
    img.onload = () => { ctx.drawImage(img, 0, hasTop ? PAD : 0, size, size); URL.revokeObjectURL(url); res(); };
    img.src = url;
  });
  const fontSize = Math.max(13, Math.round(size / 18));
  ctx.font      = `bold ${fontSize}px ${fontFamily || "'DM Mono', monospace"}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = textColor || '#0a0a0a';
  if (hasTop)    ctx.fillText(top,    size / 2, PAD * 0.64);
  if (hasBottom) ctx.fillText(bottom, size / 2, size + (hasTop ? PAD : 0) + PAD * 0.68);
  return cv;
}

export function QRCodeModal({ url: initialUrl, onClose }) {
  const previewRef  = useRef(null);
  const qrRef       = useRef(null);
  const prevLogoRef = useRef(null);

  const loadSaved = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }, []);

  const saved = loadSaved();
  const [dataType,    setDataType]    = useState(saved.dataType    || DEFAULTS.dataType);
  const [dataValues,  setDataValues]  = useState(() => {
    const dt = saved.dataType || DEFAULTS.dataType;
    return saved.dataValues || (dt === 'url' ? { url: initialUrl || '' } : {});
  });
  // Dot options
  const [dotType,        setDotType]        = useState(saved.dotType        || DEFAULTS.dotType);
  const [dotFill,        setDotFill]        = useState(saved.dotFill        || DEFAULTS.dotFill);
  const [gradientType,   setGradientType]   = useState(saved.gradientType   || DEFAULTS.gradientType);
  const [gradientAngle,  setGradientAngle]  = useState(saved.gradientAngle  ?? DEFAULTS.gradientAngle);
  const [gradientColor1, setGradientColor1] = useState(saved.gradientColor1 || DEFAULTS.gradientColor1);
  const [gradientColor2, setGradientColor2] = useState(saved.gradientColor2 || DEFAULTS.gradientColor2);
  const [cornerSq,  setCornerSq]  = useState(saved.cornerSq  || DEFAULTS.cornerSq);
  const [cornerDot, setCornerDot] = useState(saved.cornerDot || DEFAULTS.cornerDot);
  const [dark,  setDark]  = useState(saved.dark  || DEFAULTS.dark);
  const [light, setLight] = useState(saved.light || DEFAULTS.light);
  const [ecLevel, setEcLevel] = useState(saved.ecLevel || DEFAULTS.ecLevel);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  // Frame
  const [frameTop,           setFrameTop]           = useState(saved.frameTop           ?? '');
  const [frameBottom,        setFrameBottom]        = useState(saved.frameBottom        ?? '');
  const [frameTextColor,     setFrameTextColor]     = useState(saved.frameTextColor     || DEFAULTS.frameTextColor);
  const [frameBgColor,       setFrameBgColor]       = useState(saved.frameBgColor       || DEFAULTS.frameBgColor);
  const [frameBorderColor,   setFrameBorderColor]   = useState(saved.frameBorderColor   || DEFAULTS.frameBorderColor);
  const [frameBorderWidth,   setFrameBorderWidth]   = useState(saved.frameBorderWidth   ?? DEFAULTS.frameBorderWidth);
  const [frameBorderRadius,  setFrameBorderRadius]  = useState(saved.frameBorderRadius  ?? DEFAULTS.frameBorderRadius);
  const [framePadding,       setFramePadding]       = useState(saved.framePadding       ?? DEFAULTS.framePadding);
  const [frameFontFamily,    setFrameFontFamily]    = useState(saved.frameFontFamily    || DEFAULTS.frameFontFamily);
  const [frameSettingsOpen,  setFrameSettingsOpen]  = useState(false);
  // Export
  const [exportSize,  setExportSize]  = useState(saved.exportSize  || DEFAULTS.exportSize);
  const [jpgQuality,  setJpgQuality]  = useState(saved.jpgQuality  ?? DEFAULTS.jpgQuality);
  // UI state
  const [copying,  setCopying]  = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');

  const hasFrame = !!(frameTop || frameBottom);
  const qrData   = encodeQRData(dataType, dataValues) || initialUrl || 'https://baunafier.qzz.io';

  // ── Build QR options ────────────────────────────────────────────────────
  const buildQROpts = useCallback((size) => {
    const dotsOpts = dotFill === 'gradient'
      ? { type: dotType, gradient: { type: gradientType, rotation: gradientAngle * Math.PI / 180, colorStops: [{ offset: 0, color: gradientColor1 }, { offset: 1, color: gradientColor2 }] } }
      : { type: dotType, color: dark };
    return {
      width: size, height: size, type: 'canvas', data: qrData,
      dotsOptions:          dotsOpts,
      cornersSquareOptions: { type: cornerSq,  color: dark },
      cornersDotOptions:    { type: cornerDot, color: dark },
      backgroundOptions:    { color: light },
      qrOptions:            { errorCorrectionLevel: ecLevel },
      image:                logoDataUrl || '',
      ...(logoDataUrl ? { imageOptions: { crossOrigin:'anonymous', margin:4, imageSize:0.3 } } : {}),
    };
  }, [qrData, dotType, dotFill, gradientType, gradientAngle, gradientColor1, gradientColor2, cornerSq, cornerDot, dark, light, ecLevel, logoDataUrl]);

  // ── Preview render ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!previewRef.current) return;
    const opts = buildQROpts(PREVIEW_SIZE);
    const logoRemoved = prevLogoRef.current !== null && logoDataUrl === null;
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(opts);
      qrRef.current.append(previewRef.current);
    } else if (logoRemoved) {
      previewRef.current.innerHTML = '';
      qrRef.current = new QRCodeStyling(opts);
      qrRef.current.append(previewRef.current);
    } else {
      qrRef.current.update(opts);
    }
    prevLogoRef.current = logoDataUrl;
  }, [buildQROpts, logoDataUrl]);

  // ── Config helpers ────────────────────────────────────────────────────────
  function getConfigSnapshot() {
    return { dataType, dataValues, dotType, dotFill, gradientType, gradientAngle, gradientColor1, gradientColor2, cornerSq, cornerDot, dark, light, ecLevel, frameTop, frameBottom, frameTextColor, frameBgColor, frameBorderColor, frameBorderWidth, frameBorderRadius, framePadding, frameFontFamily, exportSize, jpgQuality };
  }
  function applyConfig(s) {
    if (s.dataType)              setDataType(s.dataType);
    if (s.dataValues)            setDataValues(s.dataValues);
    if (s.dotType)               setDotType(s.dotType);
    if (s.dotFill)               setDotFill(s.dotFill);
    if (s.gradientType)          setGradientType(s.gradientType);
    if (s.gradientAngle != null) setGradientAngle(s.gradientAngle);
    if (s.gradientColor1)        setGradientColor1(s.gradientColor1);
    if (s.gradientColor2)        setGradientColor2(s.gradientColor2);
    if (s.cornerSq)              setCornerSq(s.cornerSq);
    if (s.cornerDot)             setCornerDot(s.cornerDot);
    if (s.dark)                  setDark(s.dark);
    if (s.light)                 setLight(s.light);
    if (s.ecLevel)               setEcLevel(s.ecLevel);
    if (s.frameTop        != null) setFrameTop(s.frameTop);
    if (s.frameBottom     != null) setFrameBottom(s.frameBottom);
    if (s.frameTextColor)          setFrameTextColor(s.frameTextColor);
    if (s.frameBgColor)            setFrameBgColor(s.frameBgColor);
    if (s.frameBorderColor)        setFrameBorderColor(s.frameBorderColor);
    if (s.frameBorderWidth  != null) setFrameBorderWidth(s.frameBorderWidth);
    if (s.frameBorderRadius != null) setFrameBorderRadius(s.frameBorderRadius);
    if (s.framePadding      != null) setFramePadding(s.framePadding);
    if (s.frameFontFamily)           setFrameFontFamily(s.frameFontFamily);
    if (s.exportSize)    setExportSize(s.exportSize);
    if (s.jpgQuality != null) setJpgQuality(s.jpgQuality);
  }
  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getConfigSnapshot()));
    setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 1500);
  }
  function loadConfig() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!s?.dotType) { setSaveMsg('Nothing saved.'); setTimeout(() => setSaveMsg(''), 1500); return; }
      applyConfig(s);
      setSaveMsg('Loaded!'); setTimeout(() => setSaveMsg(''), 1500);
    } catch { setSaveMsg('Load failed.'); setTimeout(() => setSaveMsg(''), 1500); }
  }
  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getConfigSnapshot(), null, 2));
      setSaveMsg('Config copied!'); setTimeout(() => setSaveMsg(''), 1500);
    } catch { setSaveMsg('Copy failed.'); setTimeout(() => setSaveMsg(''), 1500); }
  }
  async function pasteConfig() {
    try {
      const text = await navigator.clipboard.readText();
      const s = JSON.parse(text);
      if (typeof s !== 'object' || !s) throw new Error('bad');
      applyConfig(s);
      setSaveMsg('Pasted!'); setTimeout(() => setSaveMsg(''), 1500);
    } catch { setSaveMsg('Paste failed — invalid config.'); setTimeout(() => setSaveMsg(''), 2000); }
  }
  function applyPreset(p) {
    setDotType(p.dotType); setCornerSq(p.cornerSq); setCornerDot(p.cornerDot);
    setDark(p.dark); setLight(p.light); setDotFill('solid');
  }
  function swapColors() { const tmp = dark; setDark(light); setLight(tmp); }

  const fileName = `qr-${(qrData||'').replace(/^https?:\/\//,'').replace(/[^a-z0-9]/gi,'-').slice(0,40)}`;

  // ── Download ───────────────────────────────────────────────────────────────
  async function download(ext) {
    if (!qrRef.current) return;
    if (ext === 'svg') { qrRef.current.download({ name: fileName, extension: 'svg' }); return; }
    const frameOpts = { top: frameTop, bottom: frameBottom, size: exportSize, textColor: frameTextColor, bgColor: frameBgColor, borderColor: frameBorderColor, borderWidth: frameBorderWidth, fontFamily: frameFontFamily, padding: framePadding };
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:-9999px;top:-9999px;';
    document.body.appendChild(container);
    try {
      const exportQR = new QRCodeStyling(buildQROpts(exportSize));
      exportQR.append(container);
      await new Promise(r => setTimeout(r, 90));
      if (hasFrame) {
        const cv = await renderFramed(exportQR, frameOpts);
        if (cv) {
          const mime = ext === 'jpg' ? 'image/jpeg' : 'image/png';
          const a = document.createElement('a');
          a.href = cv.toDataURL(mime, ext === 'jpg' ? jpgQuality : 1.0);
          a.download = `${fileName}.${ext}`; a.click(); return;
        }
      }
      const blob = await exportQR.getRawData('png');
      if (ext === 'jpg') {
        const u = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const cv2 = document.createElement('canvas');
          cv2.width = exportSize; cv2.height = exportSize;
          cv2.getContext('2d').drawImage(img, 0, 0);
          const a = document.createElement('a');
          a.href = cv2.toDataURL('image/jpeg', jpgQuality);
          a.download = `${fileName}.jpg`; a.click(); URL.revokeObjectURL(u);
        }; img.src = u;
      } else {
        const u = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = u; a.download = `${fileName}.png`; a.click();
        setTimeout(() => URL.revokeObjectURL(u), 1000);
      }
    } finally { document.body.removeChild(container); }
  }

  async function copyToClipboard() {
    try {
      setCopying(true);
      const blob = await qrRef.current?.getRawData('png'); if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch { /* clipboard unavailable */ } finally { setCopying(false); }
  }

  const handleLogoUpload = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setLogoDataUrl(ev.target.result); r.readAsDataURL(f);
  }, []);

  function onBackdrop(e) { if (e.target === e.currentTarget) onClose(); }

  const outlineBtn = {
    background:'none', border:`1px solid ${C.border2}`, borderRadius:7,
    color:C.muted, fontFamily:C.mono, fontSize:11, cursor:'pointer',
    padding:'5px 12px', transition:'color .12s, border-color .12s',
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="QR Code Generator" onClick={onBackdrop}
      style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0,0,0,0.8)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div style={{ ...glass, borderRadius:16, width:'100%', maxWidth:800, maxHeight:'92vh',
          overflowY:'auto', display:'flex', flexDirection:'column', animation:'fadeUp .2s ease', padding:'24px 24px 20px' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:C.display, fontStyle:'italic', fontSize:22, color:C.text, lineHeight:1 }}>
            ✦ QR Code Generator
          </h2>
          <button type="button" onClick={onClose} aria-label="Close QR modal"
            style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontFamily:C.mono, fontSize:18, lineHeight:1, padding:0 }}>✕</button>
        </div>

        {/* ═══ CREATE ═══ */}
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, flexShrink:0 }}>

            {/* Preview with optional frame */}
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center',
              background: hasFrame ? frameBgColor : 'transparent',
              borderRadius: hasFrame ? frameBorderRadius + 'px' : 12,
              border: hasFrame && frameBorderWidth > 0
                ? `${frameBorderWidth}px solid ${frameBorderColor}`
                : '1px solid rgba(108,99,255,0.2)',
              overflow:'hidden', width: PREVIEW_SIZE, flexShrink:0,
            }}>
              {frameTop && (
                <div style={{ width:'100%', textAlign:'center',
                  padding:`${Math.max(6, framePadding * 0.3)}px 8px`,
                  fontFamily: frameFontFamily, fontSize:13, fontWeight:700, color:frameTextColor }}>
                  {frameTop}
                </div>
              )}
              <div ref={previewRef} style={{ width:PREVIEW_SIZE, height:PREVIEW_SIZE, flexShrink:0 }} />
              {frameBottom && (
                <div style={{ width:'100%', textAlign:'center',
                  padding:`${Math.max(6, framePadding * 0.3)}px 8px`,
                  fontFamily: frameFontFamily, fontSize:13, fontWeight:700, color:frameTextColor }}>
                  {frameBottom}
                </div>
              )}
            </div>

            {/* Data preview */}
            <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, wordBreak:'break-all', textAlign:'center', maxWidth:PREVIEW_SIZE }}>
              {qrData.slice(0,80)}{qrData.length>80?'…':''}
            </div>

            {/* Export resolution */}
            <div style={{ width:'100%' }}>
              <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:5 }}>
                Export size
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
                {EXPORT_SIZES.map(s => (
                  <button key={s} type="button" onClick={() => setExportSize(s)}
                    style={{ padding:'4px 0', borderRadius:6, fontFamily:C.mono, fontSize:10, cursor:'pointer', transition:'all .12s', textAlign:'center',
                      background: exportSize===s ? C.accent : 'rgba(255,255,255,0.04)',
                      color: exportSize===s ? '#000' : C.muted,
                      border:`1px solid ${exportSize===s ? C.accent : C.border2}`, fontWeight: exportSize===s?700:400,
                    }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Export buttons */}
            <div role="group" aria-label="Export options" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, width:'100%' }}>
              {['PNG','JPG','SVG'].map(ext => (
                <button key={ext} type="button" onClick={() => download(ext.toLowerCase())} aria-label={`Download ${ext}`}
                  style={{ ...primaryBtn, padding:'8px 0', fontSize:11 }}
                  onMouseEnter={e=>{e.currentTarget.style.opacity='.88';e.currentTarget.style.boxShadow='0 0 16px rgba(108,99,255,0.35)';}}  
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

            {/* JPG quality slider — shown always but only matters for JPG */}
            <div style={{ width:'100%' }}>
              <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>
                JPG quality — {Math.round(jpgQuality * 100)}%
              </div>
              <input type="range" min="0.5" max="1" step="0.01" value={jpgQuality}
                onChange={e => setJpgQuality(Number(e.target.value))}
                style={{ width:'100%', accentColor: C.accent }} />
            </div>

            {/* Config buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, width:'100%' }}>
              {[
                { label:'💾 Save', fn: saveConfig, hover: C.accent },
                { label:'↺ Load', fn: loadConfig, hover: C.text },
                { label:'⧉ Copy config', fn: copyConfig, hover: C.accent },
                { label:'📋 Paste config', fn: pasteConfig, hover: C.text },
              ].map(b => (
                <button key={b.label} type="button" onClick={b.fn}
                  style={{ ...outlineBtn, fontSize:10, padding:'6px 4px', textAlign:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.color=b.hover;e.currentTarget.style.borderColor=b.hover;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                  {b.label}
                </button>
              ))}
            </div>
            {saveMsg && <div role="status" style={{ fontFamily:C.mono, fontSize:11, color:C.accent, textAlign:'center' }}>{saveMsg}</div>}
          </div>

          {/* ── RIGHT COLUMN ── */}
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
              <summary style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', marginBottom:8, listStyle:'none' }}>
                ▶ Presets
              </summary>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                {PRESETS.map(p => (
                  <button key={p.name} type="button" onClick={() => applyPreset(p)} aria-label={`Apply ${p.name} preset`}
                    style={{ ...outlineBtn, padding:0, display:'flex', alignItems:'stretch', overflow:'hidden', border:`1px solid ${C.border2}` }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;}}>
                    <span style={{ display:'block', width:20, background:`linear-gradient(135deg, ${p.dark} 50%, ${p.light} 50%)`, flexShrink:0 }} />
                    <span style={{ padding:'5px 9px', fontFamily:C.mono, fontSize:10, color:C.text }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </details>

            {/* Dot shape */}
            <div>
              <Label>Dot shape</Label>
              <Pill label="Dot shape" options={DOT_SHAPES} value={dotType} onChange={setDotType} />
            </div>

            {/* Dot fill */}
            <div>
              <Label>Dot fill</Label>
              <Pill label="Dot fill" options={[{id:'solid',label:'Solid color'},{id:'gradient',label:'Gradient'}]} value={dotFill} onChange={setDotFill} />
              {dotFill === 'gradient' && (
                <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8, padding:'12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:`1px solid ${C.border2}` }}>
                  <div>
                    <Label>Gradient type</Label>
                    <Pill label="Gradient type" options={[{id:'linear',label:'Linear'},{id:'radial',label:'Radial'}]} value={gradientType} onChange={setGradientType} />
                  </div>
                  {gradientType === 'linear' && (
                    <div>
                      <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginBottom:4 }}>Angle — {gradientAngle}°</div>
                      <input type="range" min="0" max="360" step="5" value={gradientAngle}
                        onChange={e => setGradientAngle(Number(e.target.value))}
                        style={{ width:'100%', accentColor: C.accent }} />
                    </div>
                  )}
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                      <input type="color" value={gradientColor1} onChange={e=>setGradientColor1(e.target.value)}
                        style={{ width:32, height:26, border:`1px solid ${C.border2}`, borderRadius:5, cursor:'pointer', background:'none', padding:2 }} />
                      <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>Start {gradientColor1}</span>
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                      <input type="color" value={gradientColor2} onChange={e=>setGradientColor2(e.target.value)}
                        style={{ width:32, height:26, border:`1px solid ${C.border2}`, borderRadius:5, cursor:'pointer', background:'none', padding:2 }} />
                      <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>End {gradientColor2}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Corner squares */}
            <div><Label>Corner squares</Label><Pill label="Corner squares" options={CORNER_SQ} value={cornerSq} onChange={setCornerSq} /></div>

            {/* Corner dots */}
            <div><Label>Corner dots</Label><Pill label="Corner dots" options={CORNER_DOT} value={cornerDot} onChange={setCornerDot} /></div>

            {/* Error correction */}
            <div>
              <Label>Error correction</Label>
              <Pill label="Error correction" options={EC_LEVELS} value={ecLevel} onChange={setEcLevel} />
              <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginTop:5, lineHeight:1.6 }}>
                L=7% · M=15% · Q=25% · H=30% recovery
                &nbsp;·&nbsp; Higher = denser QR + better damage tolerance
              </div>
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
                <button type="button" onClick={swapColors} aria-label="Swap FG / BG"
                  style={{ ...outlineBtn, fontSize:11 }}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                  ⇄ Swap
                </button>
              </div>
            </div>

            {/* Logo overlay */}
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
                {logoDataUrl && (
                  <>
                    <img src={logoDataUrl} alt="Logo preview" style={{ width:26, height:26, objectFit:'contain', borderRadius:4, border:`1px solid ${C.border2}` }} />
                    <button type="button" onClick={() => setLogoDataUrl(null)} aria-label="Remove logo"
                      style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontFamily:C.mono, fontSize:11 }}>
                      ✕ Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Frame labels + style */}
            <div>
              <Label>Frame labels</Label>
              <FieldInput label="Top text" value={frameTop} onChange={e => setFrameTop(e.target.value)} placeholder="Scan me!" />
              <FieldInput label="Bottom text" value={frameBottom} onChange={e => setFrameBottom(e.target.value)} placeholder="baunafier.qzz.io" />
              {hasFrame && (
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginBottom:8 }}>
                  ⓘ SVG export does not include frame labels (canvas-only feature).
                </div>
              )}

              {/* Frame style accordion */}
              <button type="button" onClick={() => setFrameSettingsOpen(o => !o)}
                style={{ ...outlineBtn, fontSize:10, marginBottom: frameSettingsOpen ? 10 : 0 }}
                onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.borderColor=C.accent;}}
                onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
                {frameSettingsOpen ? '▲' : '▶'} Frame style
              </button>

              {frameSettingsOpen && (
                <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:`1px solid ${C.border2}` }}>
                  {/* Color row */}
                  <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                      <input type="color" value={frameTextColor} onChange={e=>setFrameTextColor(e.target.value)}
                        style={{ width:28, height:22, borderRadius:4, border:`1px solid ${C.border2}`, cursor:'pointer', background:'none', padding:2 }} />
                      <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>Text</span>
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                      <input type="color" value={frameBgColor} onChange={e=>setFrameBgColor(e.target.value)}
                        style={{ width:28, height:22, borderRadius:4, border:`1px solid ${C.border2}`, cursor:'pointer', background:'none', padding:2 }} />
                      <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>Background</span>
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                      <input type="color" value={frameBorderColor} onChange={e=>setFrameBorderColor(e.target.value)}
                        style={{ width:28, height:22, borderRadius:4, border:`1px solid ${C.border2}`, cursor:'pointer', background:'none', padding:2 }} />
                      <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>Border</span>
                    </label>
                  </div>
                  {/* Numeric row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { label:'Border width (px)', val: frameBorderWidth, set: setFrameBorderWidth, min:0, max:20 },
                      { label:'Border radius (px)', val: frameBorderRadius, set: setFrameBorderRadius, min:0, max:40 },
                      { label:'Padding (px)', val: framePadding, set: setFramePadding, min:8, max:80 },
                    ].map(f => (
                      <label key={f.label} style={{ display:'block' }}>
                        <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{f.label}</div>
                        <input type="number" min={f.min} max={f.max} value={f.val}
                          onChange={e => f.set(Number(e.target.value))}
                          style={{ ...inputStyle, fontSize:12, padding:'5px 8px' }}
                          onFocus={e=>{e.target.style.borderColor=C.accent;}}
                          onBlur={e=>{e.target.style.borderColor=C.border2;}} />
                      </label>
                    ))}
                  </div>
                  {/* Font family */}
                  <div>
                    <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Font family</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {FONT_OPTIONS.map(f => (
                        <button key={f.id} type="button" onClick={() => setFrameFontFamily(f.id)}
                          style={{ padding:'3px 10px', borderRadius:20, cursor:'pointer', fontFamily: f.id, fontSize:11, transition:'all .12s',
                            background: frameFontFamily===f.id ? C.accent : 'rgba(255,255,255,0.04)',
                            color: frameFontFamily===f.id ? '#000' : C.muted,
                            border:`1px solid ${frameFontFamily===f.id ? C.accent : C.border2}`,
                          }}>{f.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset */}
            <button type="button" aria-label="Reset to default settings"
              onClick={() => {
                setDataType(DEFAULTS.dataType); setDataValues({ url: initialUrl||'' });
                setDotType(DEFAULTS.dotType); setDotFill(DEFAULTS.dotFill);
                setGradientType(DEFAULTS.gradientType); setGradientAngle(DEFAULTS.gradientAngle);
                setGradientColor1(DEFAULTS.gradientColor1); setGradientColor2(DEFAULTS.gradientColor2);
                setCornerSq(DEFAULTS.cornerSq); setCornerDot(DEFAULTS.cornerDot);
                setDark(DEFAULTS.dark); setLight(DEFAULTS.light); setEcLevel(DEFAULTS.ecLevel);
                setLogoDataUrl(null); setFrameTop(''); setFrameBottom('');
                setFrameTextColor(DEFAULTS.frameTextColor); setFrameBgColor(DEFAULTS.frameBgColor);
                setFrameBorderColor(DEFAULTS.frameBorderColor); setFrameBorderWidth(DEFAULTS.frameBorderWidth);
                setFrameBorderRadius(DEFAULTS.frameBorderRadius); setFramePadding(DEFAULTS.framePadding);
                setFrameFontFamily(DEFAULTS.frameFontFamily);
                setExportSize(DEFAULTS.exportSize); setJpgQuality(DEFAULTS.jpgQuality);
              }}
              style={{ ...outlineBtn, alignSelf:'flex-start' }}
              onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.text;}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border2;}}>
              ↺ Reset defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
