import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import { ToastStack } from './components/ToastStack';
import { AppRoutes } from './routes/AppRoutes';
import { GrainBg } from './components/GrainBg';
import { C } from './constants/theme';

const GLOBAL_CSS = `
:root {
  --bg: #07060f; --bg2: #0b0917; --solid: #0e0c1a;
  --accent: #6C63FF; --accent2: #FF63B8; --accent3: #A4F670;
  --text: #f0ecff; --muted: #5a5070; --muted2: #2a2535;
  --border: rgba(255,255,255,0.08); --border2: rgba(255,255,255,0.12); --border-p: rgba(108,99,255,0.25);
  --error: #f87171; --warning: #fbbf24;
  --r-sm: 9px; --r: 16px; --r-lg: 24px;
  --sidebar: 228px;
}

/* ── Keyframes ────────────────────────────────────────────────────────────── */
@keyframes slideUp    { from { opacity:0; transform:translateY(30px); filter:blur(10px); } to { opacity:1; transform:translateY(0); filter:blur(0); } }
@keyframes slideIn    { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
@keyframes slideInR   { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
@keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
@keyframes fadeUp     { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes expandD    { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
@keyframes toastIn    { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
@keyframes baunaPath  { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
@keyframes baunaText  { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
@keyframes spinSlow   { from { transform:rotate(0); } to { transform:rotate(360deg); } }
@keyframes shimmerBtn { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
@keyframes pulse      { 0%,100% { opacity:.5; } 50% { opacity:.8; } }
@keyframes ticker     { from { transform:translateX(0); } to { transform:translateX(-50%); } }
@keyframes floatA     { 0%,100%{transform:translate(0,0)} 40%{transform:translate(50px,-40px)} 70%{transform:translate(-25px,30px)} }
@keyframes floatB     { 0%,100%{transform:translate(0,0)} 35%{transform:translate(-45px,35px)} 68%{transform:translate(35px,-20px)} }
@keyframes floatC     { 0%,100%{transform:translate(0,0)} 45%{transform:translate(30px,50px)} 75%{transform:translate(-40px,-32px)} }
@keyframes card1      { 0%,100%{transform:rotate(-7deg) translateY(0)} 50%{transform:rotate(-7deg) translateY(-14px)} }
@keyframes card2      { 0%,100%{transform:rotate(5deg)  translateY(0)} 50%{transform:rotate(5deg)  translateY(-10px)} }
@keyframes card3      { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-12px)} }

/* ── Stagger helpers ──────────────────────────────────────────────────────── */
.su{animation:slideUp .8s cubic-bezier(.22,1,.36,1) both}
.d1{animation-delay:.07s}.d2{animation-delay:.18s}.d3{animation-delay:.3s}
.d4{animation-delay:.44s}.d5{animation-delay:.6s}.d6{animation-delay:.76s}.d7{animation-delay:.92s}

/* ── Glass surfaces ───────────────────────────────────────────────────────── */
.glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
.glass-p{background:rgba(108,99,255,0.07);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(108,99,255,0.2)}
.gcard{background:rgba(255,255,255,0.04);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.08);border-radius:18px;transition:all .25s cubic-bezier(.22,1,.36,1)}
.gcard:hover{border-color:rgba(255,255,255,0.14);box-shadow:0 8px 40px rgba(0,0,0,.3);transform:translateY(-2px)}
.gcard.gp:hover{border-color:rgba(108,99,255,.3);box-shadow:0 8px 40px rgba(108,99,255,.12)}
.gcard.gpk:hover{border-color:rgba(255,99,184,.3);box-shadow:0 8px 40px rgba(255,99,184,.1)}
.gcard.glm:hover{border-color:rgba(164,246,112,.3);box-shadow:0 8px 40px rgba(164,246,112,.08)}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.btn-p{display:inline-flex;align-items:center;gap:7px;background:var(--accent);color:#fff;font-family:'DM Mono',monospace;font-weight:500;font-size:13px;padding:9px 20px;border-radius:9px;border:none;cursor:pointer;transition:all .22s cubic-bezier(.22,1,.36,1);white-space:nowrap;text-decoration:none;position:relative;overflow:hidden}
.btn-p::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);background-size:200% 100%;opacity:0;transition:opacity .2s}
.btn-p:hover{background:#7B73FF;box-shadow:0 8px 36px rgba(108,99,255,.45);transform:translateY(-2px)}
.btn-p:hover::after{opacity:1;animation:shimmerBtn .6s}
.btn-p.pk{background:var(--accent2)}.btn-p.pk:hover{background:#FF75C3;box-shadow:0 6px 28px rgba(255,99,184,.4)}
.btn-g{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,0.05);color:var(--text);font-family:'DM Mono',monospace;font-size:13px;padding:12px 24px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;text-decoration:none;transition:all .25s cubic-bezier(.22,1,.36,1)}
.btn-g:hover{border-color:rgba(108,99,255,.45);background:rgba(108,99,255,.1);transform:translateY(-2px);box-shadow:0 6px 24px rgba(108,99,255,.2)}
.btn-sm{font-size:12px !important;padding:8px 18px !important}
.bico{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:var(--muted);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;flex-shrink:0;padding:0}
.bico:hover{border-color:rgba(108,99,255,.35);color:var(--accent);background:rgba(108,99,255,.08)}
.bico.red:hover{border-color:rgba(248,113,113,.4);color:#f87171;background:rgba(248,113,113,.07)}
.bico.pk:hover{border-color:rgba(255,99,184,.4);color:var(--accent2);background:rgba(255,99,184,.07)}

/* ── Input ────────────────────────────────────────────────────────────────── */
.inp{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:10px 14px;color:var(--text);font-family:'DM Mono',monospace;font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(108,99,255,.12)}
.inp::placeholder{color:var(--muted)}

/* ── Badges ───────────────────────────────────────────────────────────────── */
.badge{display:inline-flex;align-items:center;gap:5px;font-family:'DM Mono',monospace;font-size:10px;padding:3px 9px;border-radius:6px}
.badge.on{background:rgba(164,246,112,.1);color:#A4F670;border:1px solid rgba(164,246,112,.2)}
.badge.off{background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)}

/* ── Dashboard nav ────────────────────────────────────────────────────────── */
.nv{display:flex;align-items:center;gap:11px;padding:9px 14px;border-radius:10px;cursor:pointer;transition:all .2s cubic-bezier(.22,1,.36,1);margin:0 10px;font-family:'DM Mono',monospace;font-size:12.5px;color:var(--muted);border:none;background:none;width:calc(100% - 20px);text-align:left;position:relative}
.nv:hover{background:rgba(255,255,255,0.05);color:var(--text);transform:translateX(2px)}
.nv.active{background:rgba(108,99,255,0.12);color:var(--accent);border:1px solid rgba(108,99,255,0.2)}
.nv.active .nv-dot{opacity:1}
.nv-dot{width:4px;height:4px;border-radius:50%;background:var(--accent);position:absolute;right:14px;opacity:0;transition:opacity .2s;animation:pulse 2s ease-in-out infinite}

/* ── Link row ─────────────────────────────────────────────────────────────── */
.lrow{display:grid;grid-template-columns:112px 1fr 140px auto auto auto;gap:14px;align-items:center;padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:background .15s;position:relative}
.lrow:hover{background:rgba(255,255,255,0.025)}
.lrow:last-child{border-bottom:none}

/* ── Ticker ───────────────────────────────────────────────────────────────── */
.tw{overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.ti{display:flex;width:max-content;animation:ticker 40s linear infinite}

/* ── Feature cards ────────────────────────────────────────────────────────── */
.fc{background:rgba(255,255,255,0.03);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.07);border-radius:var(--r-lg);padding:28px;display:flex;flex-direction:column;gap:14px;transition:all .3s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden}
.fc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(108,99,255,.3),transparent);opacity:0;transition:opacity .3s}
.fc:hover{border-color:rgba(108,99,255,.28);box-shadow:0 12px 56px rgba(108,99,255,.14);transform:translateY(-4px)}
.fc:hover::before{opacity:1}
.fc.wide{grid-column:span 2}
.fc.pk:hover{border-color:rgba(255,99,184,.28);box-shadow:0 12px 56px rgba(255,99,184,.1)}
.fc.pk::before{background:linear-gradient(90deg,transparent,rgba(255,99,184,.3),transparent)}
.fc.lm:hover{border-color:rgba(164,246,112,.28);box-shadow:0 12px 56px rgba(164,246,112,.08)}
.fc.lm::before{background:linear-gradient(90deg,transparent,rgba(164,246,112,.3),transparent)}

/* ── Stat card top glow lines ─────────────────────────────────────────────── */
.sc-p::before,.sc-pk::before,.sc-lm::before,.sc-am::before{content:'';position:absolute;top:0;left:16px;right:16px;height:1px;border-radius:1px}
.sc-p::before{background:linear-gradient(90deg,transparent,rgba(108,99,255,.6),transparent)}
.sc-pk::before{background:linear-gradient(90deg,transparent,rgba(255,99,184,.6),transparent)}
.sc-lm::before{background:linear-gradient(90deg,transparent,rgba(164,246,112,.6),transparent)}
.sc-am::before{background:linear-gradient(90deg,transparent,rgba(251,191,36,.6),transparent)}

/* ── Slide panel & overlay ────────────────────────────────────────────────── */
.panel{position:fixed;top:0;right:0;bottom:0;width:460px;z-index:300;display:flex;flex-direction:column;overflow:hidden;animation:slideInR .32s cubic-bezier(.22,1,.36,1) both;background:rgba(14,12,26,0.92);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border-left:1px solid rgba(108,99,255,.2);box-shadow:-20px 0 60px rgba(0,0,0,.5)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:299;animation:fadeIn .22s both;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.accbtn{display:flex;align-items:center;justify-content:space-between;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:9px;padding:10px 14px;color:var(--muted);font-family:'DM Mono',monospace;font-size:12px;cursor:pointer;transition:all .18s}
.accbtn:hover{border-color:rgba(108,99,255,.3);color:var(--text);background:rgba(108,99,255,.06)}

/* ── Logo mark ────────────────────────────────────────────────────────────── */
.bauna-mark{transition:filter .3s ease}
.bauna-mark:hover{filter:drop-shadow(0 0 10px rgba(108,99,255,.5))}

/* ── Base ─────────────────────────────────────────────────────────────────── */
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${C.bg};color:${C.text};font-family:'Space Grotesk',sans-serif}
#root{position:relative;z-index:1}
a{color:inherit}
button:disabled{opacity:.5;cursor:not-allowed}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(108,99,255,.35);border-radius:3px}
input::placeholder{color:${C.muted}}
input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus,input:-webkit-autofill:active{-webkit-box-shadow:0 0 0 200px ${C.bg} inset !important;-webkit-text-fill-color:${C.text} !important;caret-color:${C.text};transition:background-color 5000s ease-in-out 0s !important}
@media(max-width:1100px){.fc-wrap{display:none}}
@media(max-width:700px){.lrow{grid-template-columns:90px 1fr auto auto !important}}
`;

export default function App() {
  const { toasts, show: toast } = useToast();
  return (
    <BrowserRouter>
      <style>{GLOBAL_CSS}</style>
      <GrainBg />
      <AuthProvider>
        <AppRoutes toast={toast} />
        <ToastStack toasts={toasts} />
      </AuthProvider>
    </BrowserRouter>
  );
}
