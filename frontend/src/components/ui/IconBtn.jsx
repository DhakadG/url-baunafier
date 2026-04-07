import { useState } from 'react';
import { C } from '../../constants/theme';

export function IconBtn({ icon, onClick, title, hoverColor, disabled: dis, style: extraStyle }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={dis} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'none', border: `1px solid ${hov ? (hoverColor || C.accent) : C.border2}`, borderRadius: 6,
        color: hov ? (hoverColor || C.accent) : C.muted, cursor: dis ? 'not-allowed' : 'pointer',
        padding: '5px 7px', lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color .15s, border-color .15s', ...extraStyle,
      }}>
      {icon}
    </button>
  );
}
