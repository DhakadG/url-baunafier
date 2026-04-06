import { useState, useEffect, useRef, useCallback } from "react";

// ── Utility: Base62 encoding ──
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function generateShortCode(len = 7) {
  const arr = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(arr, (b) => BASE62[b % 62]).join("");
}

// ── In-memory database ──
const DB = {
  _store: new Map(),
  _byUrl: new Map(),

  create(originalUrl, customAlias, expiresMinutes) {
    const existing = this._byUrl.get(originalUrl);
    if (existing && !customAlias) {
      return { ...existing, duplicate: true };
    }
    const code = customAlias || generateShortCode();
    if (this._store.has(code)) return { error: "Alias already taken" };
    const entry = {
      code,
      originalUrl,
      createdAt: Date.now(),
      expiresAt: expiresMinutes ? Date.now() + expiresMinutes * 60000 : null,
      clicks: 0,
      clickLog: [],
    };
    this._store.set(code, entry);
    if (!customAlias) this._byUrl.set(originalUrl, entry);
    return entry;
  },

  lookup(code) {
    const entry = this._store.get(code);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) return { expired: true };
    entry.clicks++;
    entry.clickLog.push(Date.now());
    return entry;
  },

  getAll() {
    return [...this._store.values()].sort((a, b) => b.createdAt - a.createdAt);
  },

  delete(code) {
    const entry = this._store.get(code);
    if (entry) {
      this._byUrl.delete(entry.originalUrl);
      this._store.delete(code);
    }
  },
};

// ── Rate limiter ──
const RateLimiter = {
  _hits: [],
  _limit: 10,
  _window: 60000,
  check() {
    const now = Date.now();
    this._hits = this._hits.filter((t) => now - t < this._window);
    if (this._hits.length >= this._limit) return false;
    this._hits.push(now);
    return true;
  },
};

// ── URL validation ──
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ── QR Code SVG generator (simple) ──
function generateQR(text) {
  // Minimal QR-like SVG as a placeholder pattern derived from URL hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;

  const size = 21;
  const cells = [];
  const rng = (seed) => {
    seed = (seed * 16807) % 2147483647;
    return { next: () => ((seed = (seed * 16807) % 2147483647) / 2147483647), seed };
  };
  let r = rng(Math.abs(hash) + 1);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isFinder =
        (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
      const isFinderInner =
        (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
        (x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4) ||
        (x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3);
      const isFinderBorder =
        isFinder &&
        (x === 0 || y === 0 || x === 6 || y === 6 || x === size - 7 || y === size - 7 || x === size - 1 || y === size - 1);

      if (isFinderInner || isFinderBorder) {
        cells.push({ x, y, fill: true });
      } else if (isFinder) {
        const outerRing = x <= 6 && y <= 6
          ? (x === 0 || x === 6 || y === 0 || y === 6)
          : x >= size - 7 && y <= 6
          ? (x === size - 7 || x === size - 1 || y === 0 || y === 6)
          : (x === 0 || x === 6 || y === size - 7 || y === size - 1);
        cells.push({ x, y, fill: outerRing });
      } else {
        cells.push({ x, y, fill: r.next() > 0.5 });
      }
    }
  }

  const scale = 6;
  const pad = 2;
  const full = (size + pad * 2) * scale;
  const rects = cells
    .filter((c) => c.fill)
    .map((c) => `<rect x="${(c.x + pad) * scale}" y="${(c.y + pad) * scale}" width="${scale}" height="${scale}" rx="1"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" width="${full}" height="${full}">
    <rect width="${full}" height="${full}" fill="white" rx="4"/>
    <g fill="#111">${rects}</g>
  </svg>`;
}

// ── Styles ──
const font = `'DM Mono', 'JetBrains Mono', 'Fira Code', monospace`;
const displayFont = `'Instrument Serif', 'Playfair Display', Georgia, serif`;

const S = {
  app: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#e8e4df",
    fontFamily: font,
    fontSize: 13,
    position: "relative",
    overflow: "hidden",
  },
  grain: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.03,
    background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    zIndex: 999,
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "40px 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    marginBottom: 56,
    borderBottom: "1px solid #222",
    paddingBottom: 32,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 52,
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    margin: 0,
    color: "#fff",
  },
  subtitle: {
    marginTop: 12,
    color: "#666",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  inputRow: {
    display: "flex",
    gap: 0,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    padding: "14px 16px",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRight: "none",
    color: "#e8e4df",
    fontFamily: font,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  inputFocus: {
    borderColor: "#A4F670",
  },
  btn: {
    padding: "14px 28px",
    background: "#A4F670",
    color: "#0a0a0a",
    border: "none",
    fontFamily: font,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  btnDisabled: {
    background: "#333",
    color: "#666",
    cursor: "not-allowed",
  },
  optionsRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  smallInput: {
    padding: "8px 12px",
    background: "#111",
    border: "1px solid #2a2a2a",
    color: "#e8e4df",
    fontFamily: font,
    fontSize: 12,
    outline: "none",
    width: 160,
  },
  select: {
    padding: "8px 12px",
    background: "#111",
    border: "1px solid #2a2a2a",
    color: "#e8e4df",
    fontFamily: font,
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  },
  error: {
    color: "#ff4444",
    fontSize: 12,
    marginBottom: 16,
    padding: "8px 12px",
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
  },
  resultCard: {
    background: "#111",
    border: "1px solid #A4F670",
    padding: 24,
    marginBottom: 32,
    animation: "slideIn 0.3s ease-out",
  },
  resultLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#666",
    marginBottom: 8,
  },
  resultUrl: {
    fontFamily: font,
    fontSize: 18,
    color: "#A4F670",
    wordBreak: "break-all",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  copyBtn: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #A4F670",
    color: "#A4F670",
    fontFamily: font,
    fontSize: 11,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  copyBtnDone: {
    background: "#A4F670",
    color: "#0a0a0a",
  },
  resultMeta: {
    marginTop: 12,
    fontSize: 11,
    color: "#555",
    display: "flex",
    gap: 16,
  },
  qrWrap: {
    marginTop: 16,
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  section: {
    marginTop: 48,
  },
  sectionTitle: {
    fontFamily: displayFont,
    fontSize: 28,
    fontWeight: 400,
    marginBottom: 20,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 60px 80px 40px",
    gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid #1a1a1a",
    alignItems: "center",
    fontSize: 12,
  },
  tableHeader: {
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #2a2a2a",
  },
  code: {
    color: "#A4F670",
    fontWeight: 600,
  },
  urlCell: {
    color: "#888",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  clickCount: {
    color: "#e8e4df",
    textAlign: "center",
  },
  statusPill: {
    padding: "2px 8px",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "center",
  },
  active: {
    color: "#A4F670",
    background: "rgba(200,255,0,0.08)",
    border: "1px solid rgba(200,255,0,0.2)",
  },
  expired: {
    color: "#ff4444",
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#444",
    cursor: "pointer",
    fontSize: 16,
    padding: 4,
    lineHeight: 1,
    transition: "color 0.15s",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 1,
    background: "#222",
    marginBottom: 32,
  },
  statCard: {
    background: "#111",
    padding: "20px 24px",
  },
  statValue: {
    fontFamily: displayFont,
    fontSize: 36,
    color: "#fff",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 10,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginTop: 6,
  },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    background: "#A4F670",
    color: "#0a0a0a",
    fontFamily: font,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    zIndex: 100,
    animation: "fadeUp 0.3s ease-out",
  },
  apiDoc: {
    background: "#111",
    border: "1px solid #1a1a1a",
    padding: 20,
    marginTop: 16,
    fontSize: 12,
    lineHeight: 1.7,
  },
  apiMethod: {
    display: "inline-block",
    padding: "2px 8px",
    background: "rgba(200,255,0,0.1)",
    color: "#A4F670",
    fontSize: 11,
    fontWeight: 700,
    marginRight: 8,
  },
  apiPath: {
    color: "#aaa",
  },
  pre: {
    background: "#0d0d0d",
    padding: 16,
    marginTop: 12,
    overflow: "auto",
    fontSize: 11,
    lineHeight: 1.6,
    color: "#888",
    border: "1px solid #1a1a1a",
  },
};

// ── Main App ──
export default function URLShortener() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiry, setExpiry] = useState("0");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [entries, setEntries] = useState([]);
  const [toast, setToast] = useState("");
  const [focused, setFocused] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const inputRef = useRef(null);

  const BASE = typeof window !== "undefined" ? window.location.origin : "https://s.link";

  const refresh = useCallback(() => setEntries(DB.getAll()), []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleShorten = () => {
    setError("");
    setResult(null);
    setCopied(false);
    setShowQR(false);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    if (!isValidUrl(normalized)) {
      setError("Invalid URL format. Include http:// or https://");
      return;
    }

    if (alias && !/^[a-zA-Z0-9_-]{2,20}$/.test(alias)) {
      setError("Alias must be 2–20 alphanumeric characters, hyphens, or underscores");
      return;
    }

    if (!RateLimiter.check()) {
      setError("Rate limit exceeded. Max 10 requests per minute.");
      return;
    }

    const expiryMin = parseInt(expiry) || 0;
    const entry = DB.create(normalized, alias.trim() || null, expiryMin);

    if (entry.error) {
      setError(entry.error);
      return;
    }

    setResult(entry);
    setUrl("");
    setAlias("");
    refresh();
    if (entry.duplicate) showToast("Returned existing short link");
  };

  const handleCopy = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(true);
      showToast("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = (code) => {
    DB.delete(code);
    refresh();
    showToast("Link deleted");
  };

  const simulateClick = (code) => {
    const entry = DB.lookup(code);
    if (entry && !entry.expired) {
      refresh();
      showToast(`Redirect → ${entry.originalUrl.slice(0, 40)}...`);
    } else if (entry?.expired) {
      showToast("Link expired");
    }
    refresh();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleShorten();
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalClicks = entries.reduce((a, e) => a + e.clicks, 0);
  const activeCount = entries.filter((e) => !e.expiresAt || Date.now() < e.expiresAt).length;

  const resultShortUrl = result ? `${BASE}/${result.code}` : "";

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #A4F670; color: #0a0a0a; }
        input::placeholder { color: #444; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        button:hover:not(:disabled) { filter: brightness(1.1); }
        .del-btn:hover { color: #ff4444 !important; }
        .row-hover:hover { background: rgba(200,255,0,0.02); }
        input:focus { border-color: #A4F670 !important; }
        .accent-line { height: 2px; background: linear-gradient(90deg, #A4F670 0%, transparent 100%); margin-bottom: 48px; }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .table-row { grid-template-columns: 90px 1fr 40px 60px 32px !important; font-size: 11px !important; }
          .opt-row { flex-direction: column !important; }
        }
      `}</style>
      <div style={S.grain} />
      <div style={S.container}>
        {/* Header */}
        <header style={S.header}>
          <h1 style={S.title}>Snip</h1>
          <p style={S.subtitle}>Fast, minimal URL shortener · REST API · Analytics</p>
        </header>
        <div className="accent-line" />

        {/* Input */}
        <div style={S.inputRow}>
          <input
            ref={inputRef}
            style={{ ...S.input, ...(focused ? S.inputFocus : {}) }}
            placeholder="Paste your long URL here…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
          <button
            style={{ ...S.btn, ...((!url.trim()) ? S.btnDisabled : {}) }}
            onClick={handleShorten}
            disabled={!url.trim()}
          >
            Shorten
          </button>
        </div>

        {/* Options */}
        <div style={S.optionsRow} className="opt-row">
          <input
            style={S.smallInput}
            placeholder="Custom alias (optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            spellCheck={false}
          />
          <select
            style={S.select}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          >
            <option value="0">No expiration</option>
            <option value="5">5 minutes</option>
            <option value="60">1 hour</option>
            <option value="1440">24 hours</option>
            <option value="10080">7 days</option>
            <option value="43200">30 days</option>
          </select>
        </div>

        {/* Error */}
        {error && <div style={S.error}>{error}</div>}

        {/* Result */}
        {result && (
          <div style={S.resultCard}>
            <div style={S.resultLabel}>
              {result.duplicate ? "Existing Short URL" : "Your Short URL"}
            </div>
            <div style={S.resultUrl}>
              <span style={{ flex: 1 }}>{resultShortUrl}</span>
              <button
                style={{ ...S.copyBtn, ...(copied ? S.copyBtnDone : {}) }}
                onClick={() => handleCopy(resultShortUrl)}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button
                style={{ ...S.copyBtn, border: "1px solid #555", color: "#888" }}
                onClick={() => setShowQR(!showQR)}
              >
                QR
              </button>
            </div>
            <div style={S.resultMeta}>
              <span>Code: {result.code}</span>
              <span>→ {result.originalUrl.length > 50 ? result.originalUrl.slice(0, 50) + "…" : result.originalUrl}</span>
              {result.expiresAt && (
                <span>Expires: {new Date(result.expiresAt).toLocaleString()}</span>
              )}
            </div>
            {showQR && (
              <div style={S.qrWrap}>
                <div
                  dangerouslySetInnerHTML={{ __html: generateQR(resultShortUrl) }}
                  style={{ width: 120, height: 120 }}
                />
                <div style={{ fontSize: 11, color: "#555", paddingTop: 4 }}>
                  Scan to open shortened link.
                  <br />
                  <span style={{ color: "#444", fontSize: 10 }}>
                    (Decorative QR pattern — for production, use a real QR library)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {entries.length > 0 && (
          <div style={S.stats} className="stats-grid">
            <div style={S.statCard}>
              <div style={S.statValue}>{entries.length}</div>
              <div style={S.statLabel}>Total Links</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statValue}>{activeCount}</div>
              <div style={S.statLabel}>Active</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statValue}>{totalClicks}</div>
              <div style={S.statLabel}>Total Clicks</div>
            </div>
          </div>
        )}

        {/* Table */}
        {entries.length > 0 && (
          <div style={S.section}>
            <h2 style={S.sectionTitle}>Links</h2>
            <div style={{ ...S.tableRow, ...S.tableHeader }} className="table-row">
              <span>Code</span>
              <span>Original URL</span>
              <span style={{ textAlign: "center" }}>Clicks</span>
              <span style={{ textAlign: "center" }}>Status</span>
              <span></span>
            </div>
            {entries.map((e) => {
              const isExpired = e.expiresAt && Date.now() > e.expiresAt;
              return (
                <div
                  key={e.code}
                  style={S.tableRow}
                  className="table-row row-hover"
                >
                  <span
                    style={{ ...S.code, cursor: "pointer" }}
                    onClick={() => simulateClick(e.code)}
                    title="Simulate redirect click"
                  >
                    /{e.code}
                  </span>
                  <span style={S.urlCell} title={e.originalUrl}>
                    {e.originalUrl}
                  </span>
                  <span style={S.clickCount}>{e.clicks}</span>
                  <span
                    style={{
                      ...S.statusPill,
                      ...(isExpired ? S.expired : S.active),
                    }}
                  >
                    {isExpired ? "Expired" : "Active"}
                  </span>
                  <button
                    className="del-btn"
                    style={S.deleteBtn}
                    onClick={() => handleDelete(e.code)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* API Documentation */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>API Reference</h2>
          <div style={S.apiDoc}>
            <div style={{ marginBottom: 20 }}>
              <span style={S.apiMethod}>POST</span>
              <span style={S.apiPath}>/api/shorten</span>
              <pre style={S.pre}>{`// Request
{
  "url": "https://example.com/very-long-url",
  "alias": "my-link",        // optional
  "expires_minutes": 1440    // optional
}

// Response → 201
{
  "short_url": "${BASE}/abc1234",
  "code": "abc1234",
  "original_url": "https://example.com/very-long-url",
  "created_at": "2026-04-05T12:00:00Z",
  "expires_at": null
}`}</pre>
            </div>
            <div style={{ marginBottom: 20 }}>
              <span style={S.apiMethod}>GET</span>
              <span style={S.apiPath}>/:short_code</span>
              <pre style={S.pre}>{`// Behavior
→ Lookup short_code in database
→ If found & not expired: HTTP 302 redirect to original URL
→ If expired: HTTP 410 Gone
→ If not found: HTTP 404 Not Found

// Click is recorded for analytics`}</pre>
            </div>
            <div>
              <span style={S.apiMethod}>GET</span>
              <span style={S.apiPath}>/api/stats/:short_code</span>
              <pre style={S.pre}>{`// Response → 200
{
  "code": "abc1234",
  "original_url": "https://example.com/very-long-url",
  "clicks": 142,
  "created_at": "2026-04-05T12:00:00Z",
  "expires_at": null,
  "click_log": [...]
}`}</pre>
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Architecture</h2>
          <div style={S.apiDoc}>
            <pre style={{ ...S.pre, color: "#666" }}>{`┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Server  │────▶│  Database   │
│  (Browser)  │◀────│  (Express)   │◀────│ (Postgres)  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │    Cache     │
                    │   (Redis)    │
                    └──────────────┘

Flow:
  POST /api/shorten → Validate → Generate code → Store → Return
  GET  /:code       → Cache check → DB lookup → 302 Redirect

Short Code Strategy:
  crypto.getRandomValues() → Base62 encode → 7 chars
  = 62^7 ≈ 3.5 trillion unique codes

Rate Limiting:
  10 requests / minute / client (sliding window)`}</pre>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid #1a1a1a",
            fontSize: 11,
            color: "#333",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Snip URL Shortener</span>
          <span>In-browser demo · No data persists on refresh</span>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}
