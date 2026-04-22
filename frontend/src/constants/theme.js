export const APP_VERSION = "2.0.0";

export const C = {
  bg: "#0a0a0a",
  card: "#111",
  border: "#1a1a1a",
  border2: "#2a2a2a",
  accent: "#A4F670",
  accentDim: "#8eb000",
  error: "#ff4444",
  warning: "#ff9900",
  text: "#e8e4df",
  muted: "#666",
  display: "'Instrument Serif', Georgia, serif",
  mono: "'DM Mono', 'JetBrains Mono', monospace",
  space: "'Space Grotesk', sans-serif",
};

// Frosted glass surface — use spread: { ...glass }
export const glass = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(164,246,112,0.12)",
};

export const inputStyle = {
  background: "rgba(10,10,10,0.7)",
  border: `1px solid ${C.border2}`,
  borderRadius: 8,
  padding: "10px 14px",
  color: C.text,
  fontFamily: C.mono,
  fontSize: 14,
  outline: "none",
  transition: "border-color .15s, box-shadow .15s",
  boxSizing: "border-box",
  width: "100%",
};

export const primaryBtn = {
  width: "100%",
  background: C.accent,
  color: "#000",
  border: "none",
  borderRadius: 8,
  padding: "11px 0",
  fontFamily: C.mono,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  transition: "opacity .15s, box-shadow .15s",
};

export const actionBtn = {
  background: "none",
  border: `1px solid ${C.border2}`,
  borderRadius: 6,
  color: C.muted,
  cursor: "pointer",
  padding: "4px 8px",
  fontSize: 13,
  fontFamily: C.mono,
  transition: "color .15s, border-color .15s",
};
