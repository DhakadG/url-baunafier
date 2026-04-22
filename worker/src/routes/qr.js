import { jsonResponse } from "../utils/response.js";
import { isValidUrl, isValidAlias } from "../utils/validation.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { buildAnalyticsSummary } from "../services/analyticsService.js";

/** GET /api/qr — list all QR codes for the authenticated user (admin sees all) */
export async function handleListQR(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const list = await env.KV.list({ prefix: "qr:" });
  const entries = [];
  for (const key of list.keys) {
    const raw = await env.KV.get(key.name);
    if (!raw) continue;
    const entry = JSON.parse(raw);
    if (session.role !== "admin" && entry.ownerId !== session.userId) continue;
    const { click_log, ...rest } = entry;
    entries.push({ ...rest, total_scans: (click_log || []).length });
  }
  entries.sort((a, b) => new Date(b.created) - new Date(a.created));
  return jsonResponse(entries, 200);
}

/** POST /api/qr — create a new QR redirect */
export async function handleCreateQR(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: "Invalid JSON body." }, 400); }

  const { slug, name, url, notes } = body;

  if (!slug || !isValidAlias(slug)) {
    return jsonResponse({ error: "Slug must be 2–40 characters with no spaces or path characters." }, 400);
  }
  if (!url || !isValidUrl(url)) {
    return jsonResponse({ error: "Invalid URL. Only http and https are allowed." }, 400);
  }
  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return jsonResponse({ error: "Name is required." }, 400);
  }

  const existing = await env.KV.get(`qr:${slug}`);
  if (existing) return jsonResponse({ error: "Slug already taken." }, 409);

  const entry = {
    slug,
    name: String(name).trim().slice(0, 100),
    url,
    notes: notes ? String(notes).trim().slice(0, 300) : "",
    active: true,
    ownerId: session.userId,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    clicks: 0,
    click_log: [],
  };

  await env.KV.put(`qr:${slug}`, JSON.stringify(entry));
  const { click_log, ...rest } = entry;
  return jsonResponse({ ...rest, total_scans: 0 }, 201);
}

/** PATCH /api/qr/:slug — partial update */
export async function handleUpdateQR(slug, request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const raw = await env.KV.get(`qr:${slug}`);
  if (!raw) return jsonResponse({ error: "QR code not found." }, 404);

  const entry = JSON.parse(raw);
  if (session.role !== "admin" && entry.ownerId !== session.userId) {
    return jsonResponse({ error: "Forbidden." }, 403);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: "Invalid JSON body." }, 400); }

  if (body.name !== undefined) entry.name = String(body.name).trim().slice(0, 100);
  if (body.url !== undefined) {
    if (!isValidUrl(body.url)) return jsonResponse({ error: "Invalid URL." }, 400);
    entry.url = body.url;
  }
  if (body.notes !== undefined) entry.notes = String(body.notes).trim().slice(0, 300);
  if (body.active !== undefined) entry.active = Boolean(body.active);
  entry.updated = new Date().toISOString();

  await env.KV.put(`qr:${slug}`, JSON.stringify(entry));
  const { click_log, ...rest } = entry;
  return jsonResponse({ ...rest, total_scans: (entry.click_log || []).length }, 200);
}

/** DELETE /api/qr/:slug */
export async function handleDeleteQR(slug, request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const raw = await env.KV.get(`qr:${slug}`);
  if (!raw) return jsonResponse({ error: "QR code not found." }, 404);

  const entry = JSON.parse(raw);
  if (session.role !== "admin" && entry.ownerId !== session.userId) {
    return jsonResponse({ error: "Forbidden." }, 403);
  }

  await env.KV.delete(`qr:${slug}`);
  return jsonResponse({ success: true }, 200);
}

/** GET /api/qr/stats/:slug — full analytics for a single QR code */
export async function handleQRStats(slug, request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const raw = await env.KV.get(`qr:${slug}`);
  if (!raw) return jsonResponse({ error: "QR code not found." }, 404);

  const entry = JSON.parse(raw);
  if (session.role !== "admin" && entry.ownerId !== session.userId) {
    return jsonResponse({ error: "Forbidden." }, 403);
  }

  const analytics = buildAnalyticsSummary(entry);
  const { click_log, ...rest } = entry;
  return jsonResponse({ ...rest, total_scans: (entry.click_log || []).length, analytics }, 200);
}

/** GET /api/admin/qr — all QR codes across all users (admin only) */
export async function handleAdminListQR(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;
  if (session.role !== "admin") return jsonResponse({ error: "Forbidden." }, 403);

  const list = await env.KV.list({ prefix: "qr:" });
  const entries = [];
  for (const key of list.keys) {
    const raw = await env.KV.get(key.name);
    if (!raw) continue;
    const entry = JSON.parse(raw);
    // Resolve owner email
    const userRaw = await env.KV.get(`user:${entry.ownerId}`);
    let ownerEmail = "—";
    if (userRaw) {
      try { ownerEmail = JSON.parse(userRaw).email || "—"; } catch {}
    }
    const { click_log, ...rest } = entry;
    entries.push({ ...rest, total_scans: (entry.click_log || []).length, owner_email: ownerEmail });
  }
  entries.sort((a, b) => new Date(b.created) - new Date(a.created));
  return jsonResponse(entries, 200);
}
