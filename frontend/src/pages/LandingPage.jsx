import { Link } from 'react-router-dom';
import { C } from '../constants/theme';
import { Logo } from '../components/Logo';
import { Footer } from '../layouts/MainLayout';

const FEATURES = [
  ['Custom Slugs', 'Choose your own short code or let us generate one.'],
  ['Password Protection', 'Lock links with a password for private sharing.'],
  ['Click Limits', 'Auto-expire links after N clicks.'],
  ['Expiry Dates', 'Set links to expire at a specific time.'],
  ['QR Codes', 'Instant QR code for every shortened link.'],
  ['Analytics', 'World map, hourly chart, browser & OS breakdown.'],
  ['Device Routing', 'iOS and Android deep-link overrides.'],
  ['OG Metadata', 'Custom Open Graph title, description, and image.'],
  ['OAuth Login', 'Sign in with Google, GitHub, or Discord.'],
  ['Admin Panel', 'Full user and link management for admins.'],
];

export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px', textAlign: 'center', gap: 40 }}>
        <Logo size="lg" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontFamily: C.display, color: C.text, lineHeight: 1.1 }}>
            Shorten. Track. <span style={{ color: C.accent }}>Launch.</span>
          </h1>
          <p style={{ fontSize: 16, fontFamily: C.space, color: C.muted, lineHeight: 1.7 }}>
            A fast, feature-rich URL shortener built on Cloudflare Workers and KV.
            Custom slugs, analytics, QR codes, device routing, and more.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/signup" style={{
            background: C.accent, color: '#000', fontFamily: C.mono, fontWeight: 700,
            fontSize: 15, padding: '13px 32px', borderRadius: 9, textDecoration: 'none',
            transition: 'opacity .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Get started free
          </Link>
          <Link to="/login" style={{
            background: 'none', color: C.text, fontFamily: C.mono,
            fontSize: 15, padding: '13px 32px', borderRadius: 9, textDecoration: 'none',
            border: `1px solid ${C.border2}`, transition: 'border-color .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border2}>
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12, maxWidth: 900, width: '100%', marginTop: 24,
        }}>
          {FEATURES.map(([title, desc]) => (
            <div key={title} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '18px 20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontFamily: C.mono, fontSize: 13, color: C.accent, fontWeight: 600 }}>{title}</span>
              <span style={{ fontFamily: C.space, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
