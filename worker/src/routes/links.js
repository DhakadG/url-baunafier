import { jsonResponse } from "../utils/response.js";
import { sha256Hex, generateCode, generateToken, generateSalt, hashPassword } from "../utils/encoder.js";
import { isValidUrl, isValidAlias } from "../utils/validation.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkRateLimit } from "../middleware/rateLimiter.js";
import { buildAnalyticsSummary } from "../services/analyticsService.js";

/** POST /api/shorten */
export async function handleShorten(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const allowed = await checkRateLimit(env, ip);
  if (!allowed) return jsonResponse({ error: "Rate limit exceeded. Try again in a minute." }, 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const { url, alias, expires_minutes, enabled = true, password, max_clicks, ios_url, android_url, og_title, og_description, og_image } = body;
  if (!url || !isValidUrl(url)) return jsonResponse({ error: "Invalid URL. Only http and https are allowed." }, 400);

  if (alias !== undefined && alias !== null && alias !== "") {
    if (!isValidAlias(alias)) return jsonResponse({ error: "Alias must be 2\u201340 characters with no spaces or path characters." }, 400);
    const taken = await env.KV.get(`link:${alias}`);
    if (taken) return jsonResponse({ error: "Alias already taken." }, 409);
  }

  let code;
  if (alias) {
    code = alias;
  } else {
    const urlHash = await sha256Hex(url);
    const existingCode = await env.KV.get(`urlhash:${urlHash}`);
    if (existingCode) {
      const existingRaw = await env.KV.get(`link:${existingCode}`);
      if (existingRaw) {
        const existingEntry = JSON.parse(existingRaw);
        if (existingEntry.userId === session.userId) {
          const origin = new URL(request.url).origin;
          return jsonResponse({ ...existingEntry, short_url: `${origin}/${existingEntry.code}` }, 200);
        }
      }
    }
    let attempts = 0;
    do {
      code = generateCode();
      const collision = await env.KV.get(`link:${code}`);
      if (!collision) break;
      attempts++;
    } while (attempts < 10);
    if (attempts >= 10) return jsonResponse({ error: "Could not generate a unique code. Try again." }, 500);
    await env.KV.put(`urlhash:${await sha256Hex(url)}`, code);
  }

  let expires_at = null;
  const expiresNum = Number(expires_minutes);
  if (expires_minutes != null && Number.isFinite(expiresNum) && expiresNum > 0) {
    expires_at = new Date(Date.now() + expiresNum * 60 * 1000).toISOString();
  }

  const entry = {
    code,
    original_url: url,
    created_at: new Date().toISOString(),
    expires_at,
    enabled: Boolean(enabled),
    clicks: 0,
    click_log: [],
    userId: session.userId,
  };

  if (password && typeof password === "string" && password.length > 0) {
    const salt = generateSalt();
    entry.password_hash = await hashPassword(password, salt);
    entry.password_salt = salt;
  }
  if (max_clicks != null && Number.isFinite(Number(max_clicks)) && Number(max_clicks) > 0) {
    entry.max_clicks = Math.floor(Number(max_clicks));
  }
  if (ios_url && isValidUrl(ios_url)) entry.ios_url = ios_url;
  if (android_url && isValidUrl(android_url)) entry.android_url = android_url;
  if (og_title) entry.og_title = String(og_title).trim().slice(0, 200);
  if (og_description) entry.og_description = String(og_description).trim().slice(0, 500);
  if (og_image && isValidUrl(og_image)) entry.og_image = og_image;

  const kvOpts = expires_at ? { expiration: Math.floor(new Date(expires_at).getTime() / 1000) } : {};
  await env.KV.put(`link:${code}`, JSON.stringify(entry), kvOpts);

  const origin = new URL(request.url).origin;
  return jsonResponse({ ...entry, short_url: `${origin}/${code}` }, 201);
}

/** GET /api/links */
export async function handleListLinks(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const origin = new URL(request.url).origin;
  const listed = await env.KV.list({ prefix: "link:" });
  const raws = await Promise.all(listed.keys.map((k) => env.KV.get(k.name)));

  const entries = [];
  for (const raw of raws) {
    if (!raw) continue;
    try {
      const entry = JSON.parse(raw);
      if (session.role !== "admin" && entry.userId !== session.userId) continue;
      entries.push({ ...entry, short_url: `${origin}/${entry.code}` });
    } catch {
      /* skip */
    }
  }

  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return jsonResponse(entries);
}

/** GET /api/stats/:code */
export async function handleGetStats(code, request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const raw = await env.KV.get(`link:${code}`);
  if (!raw) return jsonResponse({ error: "Link not found." }, 404);

  const entry = JSON.parse(raw);
  if (session.role !== "admin" && entry.userId !== session.userId) {
    return jsonResponse({ error: "Forbidden." }, 403);
  }

  const analytics = buildAnalyticsSummary(entry);
  const origin = new URL(request.url).origin;
  return jsonResponse({ ...entry, short_url: `${origin}/${entry.code}`, analytics });
}

/** PATCH /api/links/:code */
export async function handleUpdateLink(code, request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const raw = await env.KV.get(`link:${code}`);
  if (!raw) return jsonResponse({ error: "Link not found." }, 404);

  const entry = JSON.parse(raw);
  if (session.role !== "admin" && entry.userId !== session.userId) {
    return jsonResponse({ error: "Forbidden." }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  if (body.enabled !== undefined) entry.enabled = Boolean(body.enabled);
  if ("expires_at" in body) entry.expires_at = body.expires_at || null;
  if ("original_url" in body && body.original_url && isValidUrl(body.original_url)) {
    const oldHash = await sha256Hex(entry.original_url);
    await env.KV.delete(`urlhash:${oldHash}`);
    entry.original_url = body.original_url;
    await env.KV.put(`urlhash:${await sha256Hex(entry.original_url)}`, code);
  }
  if ("password" in body) {
    if (!body.password) {
      delete entry.password_hash;
      delete entry.password_salt;
    } else if (typeof body.password === "string" && body.password.length > 0) {
      const salt = generateSalt();
      entry.password_hash = await hashPassword(body.password, salt);
      entry.password_salt = salt;
    }
  }
  if ("max_clicks" in body) {
    const mc = Number(body.max_clicks);
    entry.max_clicks = body.max_clicks != null && Number.isFinite(mc) && mc > 0 ? Math.floor(mc) : null;
  }
  if ("ios_url" in body) entry.ios_url = body.ios_url && isValidUrl(body.ios_url) ? body.ios_url : null;
  if ("android_url" in body) entry.android_url = body.android_url && isValidUrl(body.android_url) ? body.android_url : null;
  if ("og_title" in body) entry.og_title = body.og_title ? String(body.og_title).trim().slice(0, 200) : null;
  if ("og_description" in body) entry.og_description = body.og_description ? String(body.og_description).trim().slice(0, 500) : null;
  if ("og_image" in body) entry.og_image = body.og_image && isValidUrl(body.og_image) ? body.og_image : null;

  const kvOpts = entry.expires_at ? { expiration: Math.floor(new Date(entry.expires_at).getTime() / 1000) } : {};
  await env.KV.put(`link:${code}`, JSON.stringify(entry), kvOpts);

  const origin = new URL(request.url).origin;
  return jsonResponse({ ...entry, short_url: `${origin}/${entry.code}` });
}

/** DELETE /api/links/:code */
export async function handleDeleteLink(code, request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;

  const raw = await env.KV.get(`link:${code}`);
  if (!raw) return jsonResponse({ error: "Link not found." }, 404);

  const entry = JSON.parse(raw);
  if (session.role !== "admin" && entry.userId !== session.userId) {
    return jsonResponse({ error: "Forbidden." }, 403);
  }

  const urlHash = await sha256Hex(entry.original_url);
  await Promise.all([env.KV.delete(`link:${code}`), env.KV.delete(`urlhash:${urlHash}`)]);
  return jsonResponse({ success: true });
}
