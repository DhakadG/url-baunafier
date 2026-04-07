import { Link } from 'react-router-dom';
import { C } from '../constants/theme';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.text, textAlign: 'center', padding: 24 }}>
      <div style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 80, color: C.border2, marginBottom: 16 }}>404</div>
      <p style={{ fontFamily: C.mono, fontSize: 16, color: C.muted, marginBottom: 32 }}>This page doesn&apos;t exist.</p>
      <Link to="/" style={{ fontFamily: C.mono, fontSize: 13, color: C.accent, textDecoration: 'none' }}>← go home</Link>
    </div>
  );
}
