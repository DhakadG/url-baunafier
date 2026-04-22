export const API = import.meta.env.VITE_API_URL || "https://go.baunafier.qzz.io";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// ── QR Redirect API ──────────────────────────────────────────────────────────

export function listQRCodes(token) {
  return fetch(`${API}/api/qr`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

export function createQRCode(token, data) {
  return fetch(`${API}/api/qr`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  }).then(async r => { const d = await r.json(); return { ok: r.ok, status: r.status, data: d }; });
}

export function updateQRCode(token, slug, data) {
  return fetch(`${API}/api/qr/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  }).then(async r => { const d = await r.json(); return { ok: r.ok, status: r.status, data: d }; });
}

export function deleteQRCode(token, slug) {
  return fetch(`${API}/api/qr/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then(async r => { const d = await r.json(); return { ok: r.ok, status: r.status, data: d }; });
}

export function getQRStats(token, slug) {
  return fetch(`${API}/api/qr/stats/${encodeURIComponent(slug)}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());
}

export function adminListQRCodes(token) {
  return fetch(`${API}/api/admin/qr`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}
