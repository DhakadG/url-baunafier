import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { C } from '../constants/theme';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export function NavBar({ toast }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: 66, display: 'flex', alignItems: 'center', padding: '0 48px',
      justifyContent: 'space-between', transition: 'background .35s, border-color .35s',
      ...(scrolled ? {
        background: 'rgba(7,6,15,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      } : {}),
    }}>
      <Link to={user ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
        <Logo size="sm" />
      </Link>
      <div style={{ display: 'flex', gap: 32 }}>
        {['Features', 'Analytics', 'Pricing'].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`}
            style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, textDecoration: 'none', letterSpacing: '.03em', transition: 'color .2s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>{l}</a>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {user?.role === 'admin' && (
          <Link to="/v1/admin" className="btn-g btn-sm" style={{ fontFamily: C.mono, fontSize: 11, color: C.accent }}>admin</Link>
        )}
        {user ? (
          <>
            <span style={{ fontFamily: C.mono, fontSize: 12, color: C.muted }}>{user.email}</span>
            <button onClick={handleLogout} className="btn-g btn-sm">logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-g btn-sm">Sign in</Link>
            <Link to="/signup" className="btn-p btn-sm">Get started free →</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '44px 48px', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['Privacy Policy', '/privacy'], ['Terms', '/terms'], ['GitHub ↗', 'https://github.com/DhakadG/url-baunafier']].map(([label, href]) => (
            <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
              style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}>{label}</a>
          ))}
        </div>
        <p style={{ fontFamily: C.mono, fontSize: 11, color: C.muted2 }}>
          © {new Date().getFullYear()} Baunafier · Built on Cloudflare Workers &amp; KV
        </p>
      </div>
    </footer>
  );
}

