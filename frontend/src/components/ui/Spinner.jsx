import { C } from '../../constants/theme';

const spinBtn = {
  background: 'none', border: `1px solid ${C.border2}`, color: C.muted, cursor: 'pointer',
  borderRadius: 5, padding: '2px 10px', fontSize: 12, lineHeight: 1.8,
  transition: 'color .15s, border-color .15s',
};

export function Spinner({ value, onChange, min = 0, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button onClick={() => onChange(value + 1)} style={spinBtn}>▲</button>
      <div style={{ fontFamily: C.mono, fontSize: 22, color: C.text, width: 44, textAlign: 'center', lineHeight: 1.2 }}>
        {String(value).padStart(2, '0')}
      </div>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={spinBtn}>▼</button>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}
