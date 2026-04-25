import { useState } from 'react';
import { Link } from 'react-router-dom';
import { C } from '../constants/theme';
import { Logo } from './Logo';

export function AuthCard({ title, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Link to="/" style={{ textDecoration: 'none', marginBottom: 36 }}><Logo size="sm" /></Link>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 16, padding: '36px 32px' }}>
        <h2 style={{ fontFamily: C.display, fontWeight: 800, fontSize: 26, color: C.text, marginBottom: 28 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function InputField({ label, ...props }) {
  const isPassword = props.type === 'password';
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input {...props} type={isPassword ? (show ? 'text' : 'password') : props.type} style={{
          width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 9,
          padding: isPassword ? '10px 44px 10px 14px' : '10px 14px', color: C.text, fontFamily: C.mono, fontSize: 13,
          outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
          ...(props.style || {}),
        }} onFocus={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.12)'; }}
           onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.boxShadow = 'none'; }} />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0,
            display: 'flex', alignItems: 'center', fontSize: 16, lineHeight: 1,
          }} tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </label>
  );
}
