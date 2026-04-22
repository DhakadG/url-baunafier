import { C } from '../../constants/theme';

export function ToggleSwitch({ enabled, onToggle, disabled: dis }) {
  return (
    <button onClick={onToggle} disabled={dis}
      title={enabled ? 'Disable (pauses redirects)' : 'Enable (resumes redirects)'}
      style={{ background: 'none', border: 'none', cursor: dis ? 'not-allowed' : 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <div style={{
        width: 34, height: 19, borderRadius: 10,
        background: enabled ? C.accent : C.border2,
        position: 'relative', transition: 'background .15s', flexShrink: 0,
        boxShadow: enabled ? '0 0 8px rgba(164,246,112,0.25)' : 'none',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: enabled ? 16 : 2,
          width: 15, height: 15, borderRadius: '50%',
          background: enabled ? '#000' : C.muted,
          transition: 'left .15s, background .15s',
        }} />
      </div>
    </button>
  );
}
