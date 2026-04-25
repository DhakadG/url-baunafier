import { useState } from 'react';
import { C } from '../../constants/theme';

export function IconBtn({ icon, onClick, title, hoverColor, active, disabled: dis, style: extraStyle }) {
  const [hov, setHov] = useState(false);
  const isRed = hoverColor === C.error;
  const col = active ? C.accent
    : hov ? (hoverColor || C.accent)
    : C.muted;
  const bg = active ? 'rgba(108,99,255,0.15)'
    : (hov && isRed) ? 'rgba(255,68,68,0.07)'
    : 'none';
  const bc = active ? C.accent
    : hov ? (isRed ? C.border2 : C.border2)
    : C.border;
  return (
    <button onClick={onClick} disabled={dis} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: bg,
        border: `1px solid ${bc}`,
        borderRadius: 6,
        color: col,
        cursor: dis ? 'not-allowed' : 'pointer',
        padding: '4px 7px', lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s', ...extraStyle,
      }}>
      {icon}
    </button>
  );
}
