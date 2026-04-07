// ============================================================
// Cloudflare Worker — URL Baunafier v1.2
// Modular ES modules build
// ============================================================
import { CORS_HEADERS } from "./config/constants.js";
import { jsonResponse } from "./utils/response.js";
import {
  handleSignup, handleLogin, handleLogout, handleMe,
  handleGoogleAuth,
  handleGithubInit, handleGithubCallback,
  handleDiscordInit, handleDiscordCallback,
} from "./routes/auth.js";
import {
  handleShorten, handleListLinks,
  handleGetStats, handleUpdateLink, handleDeleteLink,
} from "./routes/links.js";
import {
  handleAdminStats, handleAdminUsers,
  handleAdminUpdateUser, handleAdminDeleteUser,
  handleAdminLinks,
} from "./routes/admin.js";
import { handleRedirect, handlePasswordSubmit } from "./routes/redirect.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

    // Auth
    if (path === "/api/auth/signup" && method === "POST") return handleSignup(request, env);
    if (path === "/api/auth/login" && method === "POST") return handleLogin(request, env);
    if (path === "/api/auth/logout" && method === "POST") return handleLogout(request, env);
    if (path === "/api/auth/me" && method === "GET") return handleMe(request, env);
    if (path === "/api/auth/google" && method === "POST") return handleGoogleAuth(request, env);
    if (path === "/api/auth/github/init" && method === "GET") return handleGithubInit(request, env);
    if (path === "/api/auth/github/callback" && method === "GET") return handleGithubCallback(request, env);
    if (path === "/api/auth/discord/init" && method === "GET") return handleDiscordInit(request, env);
    if (path === "/api/auth/discord/callback" && method === "GET") return handleDiscordCallback(request, env);

    // Links (user)
    if (path === "/api/shorten" && method === "POST") return handleShorten(request, env);
    if (path === "/api/links" && method === "GET") return handleListLinks(request, env);

    const statsMatch = path.match(/^\/api\/stats\/([^/?#\s]{2,80})$/);
    if (statsMatch && method === "GET") {
      let statsCode;
      try { statsCode = decodeURIComponent(statsMatch[1]); } catch { statsCode = statsMatch[1]; }
      return handleGetStats(statsCode, request, env);
    }

    const linksMatch = path.match(/^\/api\/links\/([^/?#\s]{2,80})$/);
    if (linksMatch) {
      let linkCode;
      try { linkCode = decodeURIComponent(linksMatch[1]); } catch { linkCode = linksMatch[1]; }
      if (method === "PATCH") return handleUpdateLink(linkCode, request, env);
      if (method === "DELETE") return handleDeleteLink(linkCode, request, env);
    }

    // Admin
    if (path === "/api/admin/stats" && method === "GET") return handleAdminStats(request, env);
    if (path === "/api/admin/users" && method === "GET") return handleAdminUsers(request, env);
    if (path === "/api/admin/links" && method === "GET") return handleAdminLinks(request, env);

    const adminUserMatch = path.match(/^\/api\/admin\/users\/([^/?#\s]{4,80})$/);
    if (adminUserMatch) {
      if (method === "PATCH") return handleAdminUpdateUser(adminUserMatch[1], request, env);
      if (method === "DELETE") return handleAdminDeleteUser(adminUserMatch[1], request, env);
    }

    // Redirect / password submit
    const redirectMatch = path.match(/^\/([^/?#\s]{1,80})$/);
    if (redirectMatch) {
      let code;
      try { code = decodeURIComponent(redirectMatch[1]); } catch { code = redirectMatch[1]; }
      if (method === "POST") return handlePasswordSubmit(code, request, env, ctx);
      if (method === "GET") return handleRedirect(code, request, env, ctx);
    }

    return jsonResponse({ error: "Not found." }, 404);
  },
};
