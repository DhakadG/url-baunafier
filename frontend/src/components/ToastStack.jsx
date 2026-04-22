import { C } from '../constants/theme';

export function ToastStack({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? 'rgba(255,68,68,0.10)' : 'rgba(164,246,112,0.08)',
          border: `1px solid ${t.type === 'error' ? 'rgba(255,68,68,0.28)' : 'rgba(164,246,112,0.28)'}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 9,
          color: t.type === 'error' ? C.error : C.accent,
          padding: '10px 18px', fontSize: 13,
          fontFamily: C.mono, maxWidth: 320, whiteSpace: 'nowrap',
          animation: 'toastIn .2s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
