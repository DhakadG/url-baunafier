import { jsonResponse } from "../utils/response.js";

export async function getSession(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const raw = await env.KV.get(`session:${token}`);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      await env.KV.delete(`session:${token}`);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Returns { session } or { error: Response }
export async function requireAuth(request, env) {
  const session = await getSession(request, env);
  if (!session) return { error: jsonResponse({ error: "Unauthorized." }, 401) };
  return { session };
}

// Returns { session } or { error: Response }
export async function requireAdmin(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return { error };
  if (session.role !== "admin") return { error: jsonResponse({ error: "Forbidden." }, 403) };
  return { session };
}
