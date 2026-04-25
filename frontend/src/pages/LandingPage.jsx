import { useState } from 'react';
import { Link } from 'react-router-dom';
import { C } from '../constants/theme';
import { GrainBg } from '../components/GrainBg';
import { Logo } from '../components/Logo';
import { Footer } from '../layouts/MainLayout';
import { NavBar } from '../layouts/MainLayout';

/* ── Orb blobs for hero depth ─────────────────────────────────────────────── */
function Orbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', top: -200, left: '50%', transform: 'translateX(-55%)', background: 'radial-gradient(circle, rgba(108,99,255,0.13) 0%, transparent 70%)', animation: 'floatA 18s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', top: 100, right: -150, background: 'radial-gradient(circle, rgba(255,99,184,0.09) 0%, transparent 70%)', animation: 'floatB 22s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bottom: -100, left: -80, background: 'radial-gradient(circle, rgba(164,246,112,0.06) 0%, transparent 70%)', animation: 'floatC 25s ease-in-out infinite' }} />
    </div>
  );
}

/* ── Dot grid overlay ─────────────────────────────────────────────────────── */
function DotGrid() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, opacity: 0.35,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)',
    }} />
  );
}

/* ── Vignette ─────────────────────────────────────────────────────────────── */
function Vignette() {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, background: 'radial-gradient(ellipse 100% 100% at 50% 0%, transparent 40%, rgba(7,6,15,0.7) 100%)' }} />;
}

/* ── Floating hero card ───────────────────────────────────────────────────── */
function HeroCard({ style, children }) {
  return (
    <div style={{
      position: 'absolute',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      padding: '14px 18px',
      fontFamily: C.mono,
      fontSize: 12,
      color: C.text,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</div>
  );
}

/* ── Demo widget ──────────────────────────────────────────────────────────── */
function DemoWidget() {
  const [url, setUrl] = useState('');
  return (
    <div className="su d4" style={{ width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          className="inp"
          placeholder="Paste a long URL here…"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ flex: 1 }}
        />
        <Link to="/signup" className="btn-p" style={{ textDecoration: 'none', flexShrink: 0 }}>Shorten →</Link>
      </div>
      <p style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>Free to use · No sign-up required to preview</p>
    </div>
  );
}

/* ── Ticker ───────────────────────────────────────────────────────────────── */
const TICKER_ITEMS = ['Custom slugs', 'Password protected links', 'Click limits', 'Expiry dates', 'QR codes', 'World analytics', 'Device routing', 'OG metadata', 'OAuth login', 'Admin panel', 'Bot detection', 'UTM tracking'];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
      <div className="tw">
        <div className="ti" style={{ gap: 48, alignItems: 'center' }}>
          {items.map((item, i) => (
            <span key={i} style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, letterSpacing: '.05em', display: 'flex', alignItems: 'center', gap: 14 }}>
              {item}
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(108,99,255,0.5)' }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Feature cards ────────────────────────────────────────────────────────── */
const FEATURES = [
  { title: 'Custom Slugs', desc: 'Choose your own short code or let us generate one.', icon: '✦', variant: '' },
  { title: 'Password Protection', desc: 'Lock links with a password for private sharing.', icon: '🔒', variant: '' },
  { title: 'Click Limits', desc: 'Auto-expire links after N clicks.', icon: '⚡', variant: '' },
  { title: 'Expiry Dates', desc: 'Set links to expire at a specific date and time.', icon: '⏳', variant: 'pk' },
  { title: 'QR Codes', desc: 'Instant QR code for every shortened link, bulk download.', icon: '▦', variant: 'pk', wide: true },
  { title: 'World Analytics', desc: 'Interactive world map, hourly chart, device & browser breakdown, UTM tracking.', icon: '◉', variant: '' },
  { title: 'Device Routing', desc: 'Send iOS and Android users to different URLs automatically.', icon: '📱', variant: 'lm' },
  { title: 'OG Metadata', desc: 'Custom Open Graph title, description, and image per link.', icon: '◈', variant: '' },
  { title: 'OAuth Login', desc: 'One-click sign in with Google, GitHub, or Discord.', icon: '◌', variant: 'lm', wide: true },
  { title: 'Admin Panel', desc: 'Full user and link management for platform administrators.', icon: '⊞', variant: '' },
];

/* ── Main Page ────────────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative' }}>
      <GrainBg />
      <NavBar />

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', gap: 32 }}>
        <Orbs />
        <DotGrid />
        <Vignette />

        {/* floating cards — hidden on mobile */}
        <div className="fc-wrap" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
          <HeroCard style={{ left: 'max(40px, 6vw)', top: '30%', animation: 'card1 6s ease-in-out infinite' }}>
            <div style={{ color: C.accent, marginBottom: 4 }}>go.baunafier.qzz.io/<strong>launch</strong></div>
            <div style={{ color: C.muted, fontSize: 11 }}>↗ 1,284 clicks · active</div>
          </HeroCard>
          <HeroCard style={{ right: 'max(40px, 6vw)', top: '22%', animation: 'card2 7s 1s ease-in-out infinite' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div>
                <div style={{ color: C.muted, fontSize: 10, marginBottom: 3 }}>this week</div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 18 }}>4,821</div>
              </div>
              <svg width="52" height="22" viewBox="0 0 52 22"><polyline points="0,20 8,14 16,17 24,10 32,13 40,5 52,8" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
          </HeroCard>
          <HeroCard style={{ left: 'max(60px, 8vw)', bottom: '28%', animation: 'card3 8s 2s ease-in-out infinite' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: C.accent3, fontSize: 10 }}>● active</span>
              <span style={{ color: C.muted, fontSize: 10 }}>QR ready</span>
              <span style={{ color: C.accent2, fontSize: 10 }}>🔒 pw</span>
            </div>
          </HeroCard>
        </div>

        {/* headline */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div className="su" style={{ display: 'inline-block', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.22)', borderRadius: 20, padding: '4px 14px', fontFamily: C.mono, fontSize: 11, color: C.accent, letterSpacing: '.06em' }}>
            Built on Cloudflare Workers · Edge-first
          </div>
          <h1 className="su d1" style={{
            fontSize: 'clamp(3rem,7vw,5.5rem)', fontFamily: C.display, fontWeight: 800,
            color: C.text, lineHeight: 1.0, letterSpacing: '-0.04em', margin: 0,
          }}>
            Shorten. Track.{' '}
            <span style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #FF63B8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Launch.
            </span>
          </h1>
          <p className="su d2" style={{ fontFamily: C.space, fontSize: 17, color: C.muted, lineHeight: 1.7, maxWidth: 520 }}>
            A fast, feature-rich URL shortener. Custom slugs, click analytics, QR codes, device routing, and more — all on the edge.
          </p>
          <div className="su d3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/signup" className="btn-p">Get started free →</Link>
            <Link to="/login" className="btn-g">Sign in</Link>
          </div>
          <DemoWidget />
        </div>
      </section>

      <Ticker />

      {/* ── Features bento ── */}
      <section id="features" style={{ position: 'relative', zIndex: 10, padding: '100px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="su" style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', color: C.text, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Everything you need
          </h2>
          <p style={{ fontFamily: C.space, fontSize: 16, color: C.muted }}>
            Every feature you'd expect — and a few you didn't.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, gridAutoRows: 'auto' }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`fc su d${Math.min(i + 1, 7)}${f.variant ? ' ' + f.variant : ''}${f.wide ? ' wide' : ''}`}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <span style={{ fontFamily: C.space, fontWeight: 600, fontSize: 15, color: C.text }}>{f.title}</span>
              <span style={{ fontFamily: C.space, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 10, padding: '80px 40px 100px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <h2 className="su" style={{ fontFamily: C.display, fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', color: C.text, letterSpacing: '-0.03em' }}>
          Free. Forever. Open source.
        </h2>
        <p className="su d1" style={{ fontFamily: C.space, fontSize: 16, color: C.muted, maxWidth: 440 }}>
          Self-host on your own Cloudflare account in minutes. No per-click fees, no lock-in.
        </p>
        <div className="su d2" style={{ display: 'flex', gap: 12 }}>
          <Link to="/signup" className="btn-p">Create free account →</Link>
          <a href="https://github.com/DhakadG/url-baunafier" target="_blank" rel="noreferrer" className="btn-g">View on GitHub ↗</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

