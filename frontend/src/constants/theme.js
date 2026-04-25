export const APP_VERSION = "2.0.0";

export const C = {
  // Backgrounds
  bg:      "#07060f",
  bg2:     "#0b0917",
  solid:   "#0e0c1a",

  // Accents
  accent:  "#6C63FF",   // electric purple — primary CTA, active states
  accent2: "#FF63B8",   // hot pink — QR section, secondary CTAs
  accent3: "#A4F670",   // lime green — positive deltas, active badges

  // Text
  text:    "#f0ecff",
  muted:   "#5a5070",
  muted2:  "#2a2535",

  // Borders
  border:  "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.12)",
  borderP: "rgba(108,99,255,0.25)",

  // Semantic
  error:   "#f87171",
  warning: "#fbbf24",

  // Fonts
  display: "'Syne', sans-serif",
  mono:    "'DM Mono', monospace",
  space:   "'Space Grotesk', sans-serif",

  // Border radius
  rSm: "9px",
  r:   "16px",
  rLg: "24px",
};

// Frosted glass surface — use spread: { ...glass }
export const glass = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

export const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 9,
  padding: "10px 14px",
  color: C.text,
  fontFamily: C.mono,
  fontSize: 13,
  outline: "none",
  transition: "border-color .15s, box-shadow .15s",
  boxSizing: "border-box",
  width: "100%",
};

export const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  background: C.accent,
  color: "#ffffff",
  border: "none",
  borderRadius: 9,
  padding: "9px 20px",
  fontFamily: C.mono,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all .22s cubic-bezier(.22,1,.36,1)",
  whiteSpace: "nowrap",
};

export const actionBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: C.muted,
  cursor: "pointer",
  width: 30,
  height: 30,
  transition: "all .18s",
};
