import { C } from '../../constants/theme';

export function ToggleSwitch({ enabled, onToggle, disabled: dis }) {
  return (
    <button onClick={onToggle} disabled={dis}
      title={enabled ? 'Disable link (pauses redirects)' : 'Enable link (resumes redirects)'}
      style={{ background: 'none', border: 'none', cursor: dis ? 'not-allowed' : 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 38, height: 22, borderRadius: 11, background: enabled ? C.accent : C.border2, position: 'relative', transition: 'background .22s', flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: enabled ? '#000' : '#555', position: 'absolute', top: 3, left: enabled ? 19 : 3, transition: 'left .22s, background .22s' }} />
      </div>
      <span style={{ fontFamily: C.mono, fontSize: 11, color: enabled ? C.accent : C.muted, minWidth: 22 }}>{enabled ? 'live' : 'off'}</span>
    </button>
  );
}
