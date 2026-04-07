import { jsonResponse } from "../utils/response.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

/** GET /api/admin/stats */
export async function handleAdminStats(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;

  const [usersListed, linksListed] = await Promise.all([env.KV.list({ prefix: "user:" }), env.KV.list({ prefix: "link:" })]);

  const linkRaws = await Promise.all(linksListed.keys.map((k) => env.KV.get(k.name)));
  let total_clicks = 0;
  for (const raw of linkRaws) {
    if (!raw) continue;
    try {
      total_clicks += JSON.parse(raw).clicks || 0;
    } catch {
      /* skip */
    }
  }

  return jsonResponse({
    total_users: usersListed.keys.length,
    total_links: linksListed.keys.length,
    total_clicks,
  });
}

/** GET /api/admin/users */
export async function handleAdminUsers(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;

  const listed = await env.KV.list({ prefix: "user:" });
  const raws = await Promise.all(listed.keys.map((k) => env.KV.get(k.name)));

  // Count links per user
  const linksListed = await env.KV.list({ prefix: "link:" });
  const linkRaws = await Promise.all(linksListed.keys.map((k) => env.KV.get(k.name)));
  const linkCountByUser = {};
  for (const raw of linkRaws) {
    if (!raw) continue;
    try {
      const e = JSON.parse(raw);
      if (e.userId) linkCountByUser[e.userId] = (linkCountByUser[e.userId] || 0) + 1;
    } catch {
      /* skip */
    }
  }

  const users = [];
  for (const raw of raws) {
    if (!raw) continue;
    try {
      const u = JSON.parse(raw);
      users.push({ id: u.id, email: u.email, role: u.role, created_at: u.created_at, disabled: u.disabled, link_count: linkCountByUser[u.id] || 0 });
    } catch {
      /* skip */
    }
  }
  users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return jsonResponse(users);
}

/** PATCH /api/admin/users/:id */
export async function handleAdminUpdateUser(userId, request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;

  const raw = await env.KV.get(`user:${userId}`);
  if (!raw) return jsonResponse({ error: "User not found." }, 404);

  const user = JSON.parse(raw);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON." }, 400);
  }

  if (body.role !== undefined && ["user", "admin"].includes(body.role)) user.role = body.role;
  if (body.disabled !== undefined) user.disabled = Boolean(body.disabled);

  await env.KV.put(`user:${userId}`, JSON.stringify(user));
  return jsonResponse({ id: user.id, email: user.email, role: user.role, disabled: user.disabled });
}

/** DELETE /api/admin/users/:id */
export async function handleAdminDeleteUser(userId, request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;

  const raw = await env.KV.get(`user:${userId}`);
  if (!raw) return jsonResponse({ error: "User not found." }, 404);

  const user = JSON.parse(raw);
  const linksListed = await env.KV.list({ prefix: "link:" });
  const linkRaws = await Promise.all(linksListed.keys.map((k) => env.KV.get(k.name)));

  let deleted_links = 0;
  const delOps = [];
  for (const linkRaw of linkRaws) {
    if (!linkRaw) continue;
    try {
      const e = JSON.parse(linkRaw);
      if (e.userId === userId) {
        delOps.push(env.KV.delete(`link:${e.code}`));
        deleted_links++;
      }
    } catch {
      /* skip */
    }
  }

  await Promise.all([env.KV.delete(`user:${userId}`), env.KV.delete(`email:${user.email}`), ...delOps]);
  return jsonResponse({ success: true, deleted_links });
}

/** GET /api/admin/links */
export async function handleAdminLinks(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;

  const origin = new URL(request.url).origin;
  const listed = await env.KV.list({ prefix: "link:" });
  const raws = await Promise.all(listed.keys.map((k) => env.KV.get(k.name)));

  const entries = [];
  for (const raw of raws) {
    if (!raw) continue;
    try {
      const entry = JSON.parse(raw);
      let owner_email = "unknown";
      if (entry.userId) {
        const userRaw = await env.KV.get(`user:${entry.userId}`);
        if (userRaw) owner_email = JSON.parse(userRaw).email;
      }
      entries.push({ ...entry, short_url: `${origin}/${entry.code}`, owner_email });
    } catch {
      /* skip */
    }
  }
  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return jsonResponse(entries);
}
