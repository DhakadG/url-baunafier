import { C } from '../constants/theme';

export function ToastStack({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? C.error : t.type === 'success' ? C.accent : C.card,
          color: t.type === 'success' ? '#000' : C.text,
          padding: '10px 18px', borderRadius: 8, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,.5)',
          fontFamily: C.mono, maxWidth: 320,
          animation: 'slideIn .2s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
