import { useState, useEffect } from 'react';
import { C } from '../constants/theme';
import { Spinner } from './ui/Spinner';

const QUICK_CHIPS = [
  { label: 'None', minutes: null },
  { label: '5 min', minutes: 5 },
  { label: '1 hour', minutes: 60 },
  { label: '24 hours', minutes: 1440 },
  { label: '7 days', minutes: 10080 },
  { label: '30 days', minutes: 43200 },
];

export function ExpiryPicker({ value, onChange }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!customOpen) return;
    const total = days * 1440 + hours * 60 + minutes;
    onChange(total > 0 ? total : null);
  }, [days, hours, minutes, customOpen]); // eslint-disable-line

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {QUICK_CHIPS.map(c => {
          const active = !customOpen && c.minutes === value;
          return (
            <button key={c.label} onClick={() => { setCustomOpen(false); onChange(c.minutes); }} style={{
              background: active ? C.accent : 'none', color: active ? '#000' : C.muted,
              border: `1px solid ${active ? C.accent : C.border2}`,
              borderRadius: 6, padding: '5px 12px', fontFamily: C.mono, fontSize: 12,
              cursor: 'pointer', transition: 'all .15s',
            }}>{c.label}</button>
          );
        })}
        <button onClick={() => { setCustomOpen(o => !o); if (!customOpen) onChange(null); }} style={{
          background: customOpen ? C.accent : 'none', color: customOpen ? '#000' : C.muted,
          border: `1px solid ${customOpen ? C.accent : C.border2}`,
          borderRadius: 6, padding: '5px 12px', fontFamily: C.mono, fontSize: 12,
          cursor: 'pointer', transition: 'all .15s',
        }}>Custom ✦</button>
      </div>

      {customOpen && (
        <div style={{
          display: 'flex', gap: 24, padding: '16px 20px',
          background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10,
          width: 'fit-content', alignItems: 'flex-start',
        }}>
          <Spinner value={days} onChange={setDays} label="days" />
          <Spinner value={hours} onChange={v => setHours(Math.min(23, v))} label="hours" />
          <Spinner value={minutes} onChange={v => setMinutes(Math.min(59, v))} label="min" />
        </div>
      )}
    </div>
  );
}
