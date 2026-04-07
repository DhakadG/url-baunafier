import { jsonResponse, htmlResponse } from "../utils/response.js";
import { generateToken, generateSalt, hashPassword } from "../utils/encoder.js";
import { isValidEmail } from "../utils/validation.js";
import { SESSION_TTL_SEC } from "../config/constants.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { oauthSuccessPage, oauthErrorPage } from "../utils/pages.js";

/** POST /api/auth/signup */
export async function handleSignup(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON." }, 400);
  }

  const { email, password } = body;
  if (!email || !isValidEmail(email)) return jsonResponse({ error: "Invalid email address." }, 400);
  if (!password || password.length < 8) return jsonResponse({ error: "Password must be at least 8 characters." }, 400);

  const normalEmail = email.toLowerCase().trim();
  const existing = await env.KV.get(`email:${normalEmail}`);
  if (existing) return jsonResponse({ error: "Email already registered." }, 409);

  const userId = "usr_" + generateToken().slice(0, 12);
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  let role = "user";
  if (env.ADMIN_EMAIL && normalEmail === env.ADMIN_EMAIL.toLowerCase().trim()) role = "admin";

  const user = { id: userId, email: normalEmail, passwordHash, salt, role, created_at: new Date().toISOString(), disabled: false };
  await Promise.all([env.KV.put(`user:${userId}`, JSON.stringify(user)), env.KV.put(`email:${normalEmail}`, userId)]);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000).toISOString();
  await env.KV.put(`session:${token}`, JSON.stringify({ userId, role, expiresAt }), { expirationTtl: SESSION_TTL_SEC });

  return jsonResponse({ token, user: { id: userId, email: normalEmail, role, created_at: user.created_at } }, 201);
}

/** POST /api/auth/login */
export async function handleLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON." }, 400);
  }

  const { email, password } = body;
  if (!email || !password) return jsonResponse({ error: "Email and password are required." }, 400);

  const normalEmail = email.toLowerCase().trim();
  const userId = await env.KV.get(`email:${normalEmail}`);
  if (!userId) return jsonResponse({ error: "Invalid email or password." }, 401);

  const raw = await env.KV.get(`user:${userId}`);
  if (!raw) return jsonResponse({ error: "Invalid email or password." }, 401);

  const user = JSON.parse(raw);
  if (user.disabled) return jsonResponse({ error: "Account is disabled." }, 403);

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) return jsonResponse({ error: "Invalid email or password." }, 401);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000).toISOString();
  await env.KV.put(`session:${token}`, JSON.stringify({ userId, role: user.role, expiresAt }), { expirationTtl: SESSION_TTL_SEC });

  return jsonResponse({ token, user: { id: userId, email: normalEmail, role: user.role, created_at: user.created_at } });
}

/** POST /api/auth/logout */
export async function handleLogout(request, env) {
  const auth = request.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    await env.KV.delete(`session:${token}`);
  }
  return jsonResponse({ success: true });
}

/** GET /api/auth/me */
export async function handleMe(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;
  const raw = await env.KV.get(`user:${session.userId}`);
  if (!raw) return jsonResponse({ error: "User not found." }, 404);
  const user = JSON.parse(raw);
  return jsonResponse({ id: user.id, email: user.email, role: user.role, created_at: user.created_at, disabled: user.disabled });
}

/** POST /api/auth/google — verify Google ID token, find/create user, return session */
export async function handleGoogleAuth(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON." }, 400);
  }
  const { credential } = body;
  if (!credential) return jsonResponse({ error: "Missing credential." }, 400);

  const tokenResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!tokenResp.ok) return jsonResponse({ error: "Invalid Google token." }, 401);
  const info = await tokenResp.json();

  if (env.GOOGLE_CLIENT_ID && info.aud !== env.GOOGLE_CLIENT_ID) {
    return jsonResponse({ error: "Token audience mismatch." }, 401);
  }
  if (!info.email) return jsonResponse({ error: "Google account has no email." }, 400);
  if (info.email_verified === "false" || info.email_verified === false) {
    return jsonResponse({ error: "Google email not verified." }, 400);
  }

  const normalEmail = info.email.toLowerCase().trim();
  let userId = await env.KV.get(`email:${normalEmail}`);
  let userData;

  if (!userId) {
    userId = "usr_" + generateToken().slice(0, 12);
    const role = env.ADMIN_EMAIL && normalEmail === env.ADMIN_EMAIL.toLowerCase().trim() ? "admin" : "user";
    userData = { id: userId, email: normalEmail, passwordHash: null, salt: null, googleId: info.sub, role, created_at: new Date().toISOString(), disabled: false };
    await Promise.all([env.KV.put(`user:${userId}`, JSON.stringify(userData)), env.KV.put(`email:${normalEmail}`, userId)]);
  } else {
    const raw = await env.KV.get(`user:${userId}`);
    if (!raw) return jsonResponse({ error: "Account not found." }, 404);
    userData = JSON.parse(raw);
    if (userData.disabled) return jsonResponse({ error: "Account is disabled." }, 403);
    if (!userData.googleId) {
      userData.googleId = info.sub;
      await env.KV.put(`user:${userId}`, JSON.stringify(userData));
    }
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000).toISOString();
  await env.KV.put(`session:${token}`, JSON.stringify({ userId, role: userData.role, expiresAt }), { expirationTtl: SESSION_TTL_SEC });

  const { passwordHash: _ph, salt: _s, ...safeUser } = userData;
  return jsonResponse({ token, user: safeUser });
}

/** GET /api/auth/github/init */
export async function handleGithubInit(request, env) {
  const frontendUrl = env.FRONTEND_URL || "";
  if (!env.GITHUB_CLIENT_ID) return htmlResponse(oauthErrorPage("GitHub sign-in is not configured.", frontendUrl));
  const state = generateToken().slice(0, 24);
  await env.KV.put(`oauth_state:${state}`, JSON.stringify({ provider: "github", ts: Date.now() }), { expirationTtl: 600 });
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/github/callback`,
    scope: "user:email",
    state,
    allow_signup: "true",
  });
  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
}

/** GET /api/auth/github/callback */
export async function handleGithubCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const frontendUrl = env.FRONTEND_URL || "";

  if (!code || !state) return htmlResponse(oauthErrorPage("Missing code or state.", frontendUrl));
  const stateRaw = await env.KV.get(`oauth_state:${state}`);
  if (!stateRaw) return htmlResponse(oauthErrorPage("Invalid or expired state. Please try again.", frontendUrl));
  await env.KV.delete(`oauth_state:${state}`);

  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
  });
  if (!tokenResp.ok) return htmlResponse(oauthErrorPage("GitHub token exchange failed.", frontendUrl));
  const tokenData = await tokenResp.json();
  if (tokenData.error) return htmlResponse(oauthErrorPage(tokenData.error_description || tokenData.error, frontendUrl));

  const accessToken = tokenData.access_token;

  const ghUserResp = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "URL-Baunafier/1.2" },
  });
  if (!ghUserResp.ok) return htmlResponse(oauthErrorPage("GitHub user fetch failed.", frontendUrl));
  const ghUser = await ghUserResp.json();

  let email = ghUser.email;
  if (!email) {
    const emailResp = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "URL-Baunafier/1.2" },
    });
    if (emailResp.ok) {
      const emails = await emailResp.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary ? primary.email : (emails.find((e) => e.verified) || emails[0] || null)?.email || null;
    }
  }
  if (!email) return htmlResponse(oauthErrorPage("No verified email on GitHub account. Please make a verified email public in GitHub settings.", frontendUrl));

  const normalEmail = email.toLowerCase().trim();
  let userId = await env.KV.get(`email:${normalEmail}`);
  let userData;

  if (!userId) {
    userId = "usr_" + generateToken().slice(0, 12);
    const role = env.ADMIN_EMAIL && normalEmail === env.ADMIN_EMAIL.toLowerCase().trim() ? "admin" : "user";
    userData = { id: userId, email: normalEmail, passwordHash: null, salt: null, githubId: String(ghUser.id), role, created_at: new Date().toISOString(), disabled: false };
    await Promise.all([env.KV.put(`user:${userId}`, JSON.stringify(userData)), env.KV.put(`email:${normalEmail}`, userId)]);
  } else {
    const raw = await env.KV.get(`user:${userId}`);
    if (!raw) return htmlResponse(oauthErrorPage("Account data not found.", frontendUrl));
    userData = JSON.parse(raw);
    if (userData.disabled) return htmlResponse(oauthErrorPage("Account is disabled.", frontendUrl));
    if (!userData.githubId) {
      userData.githubId = String(ghUser.id);
      await env.KV.put(`user:${userId}`, JSON.stringify(userData));
    }
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000).toISOString();
  await env.KV.put(`session:${token}`, JSON.stringify({ userId, role: userData.role, expiresAt }), { expirationTtl: SESSION_TTL_SEC });

  const { passwordHash: _ph, salt: _s, ...safeUser } = userData;
  return htmlResponse(oauthSuccessPage(token, safeUser, frontendUrl));
}

/** GET /api/auth/discord/init */
export async function handleDiscordInit(request, env) {
  const frontendUrl = env.FRONTEND_URL || "";
  if (!env.DISCORD_CLIENT_ID) return htmlResponse(oauthErrorPage("Discord sign-in is not configured.", frontendUrl));
  const state = generateToken().slice(0, 24);
  await env.KV.put(`oauth_state:${state}`, JSON.stringify({ provider: "discord", ts: Date.now() }), { expirationTtl: 600 });
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify email",
    state,
  });
  return Response.redirect(`https://discord.com/api/oauth2/authorize?${params}`, 302);
}

/** GET /api/auth/discord/callback */
export async function handleDiscordCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const frontendUrl = env.FRONTEND_URL || "";

  if (!code || !state) return htmlResponse(oauthErrorPage("Missing code or state.", frontendUrl));
  const stateRaw = await env.KV.get(`oauth_state:${state}`);
  if (!stateRaw) return htmlResponse(oauthErrorPage("Invalid or expired state. Please try again.", frontendUrl));
  await env.KV.delete(`oauth_state:${state}`);

  const origin = new URL(request.url).origin;
  const tokenResp = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/auth/discord/callback`,
    }),
  });
  if (!tokenResp.ok) return htmlResponse(oauthErrorPage("Discord token exchange failed.", frontendUrl));
  const tokenData = await tokenResp.json();
  if (tokenData.error) return htmlResponse(oauthErrorPage(tokenData.error_description || tokenData.error, frontendUrl));

  const accessToken = tokenData.access_token;

  const dcUserResp = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!dcUserResp.ok) return htmlResponse(oauthErrorPage("Discord user fetch failed.", frontendUrl));
  const dcUser = await dcUserResp.json();

  if (!dcUser.email) return htmlResponse(oauthErrorPage("No email on Discord account. Please add and verify an email in Discord settings.", frontendUrl));
  if (!dcUser.verified) return htmlResponse(oauthErrorPage("Discord email is not verified. Please verify your email in Discord settings first.", frontendUrl));

  const normalEmail = dcUser.email.toLowerCase().trim();
  let userId = await env.KV.get(`email:${normalEmail}`);
  let userData;

  if (!userId) {
    userId = "usr_" + generateToken().slice(0, 12);
    const role = env.ADMIN_EMAIL && normalEmail === env.ADMIN_EMAIL.toLowerCase().trim() ? "admin" : "user";
    userData = { id: userId, email: normalEmail, passwordHash: null, salt: null, discordId: String(dcUser.id), role, created_at: new Date().toISOString(), disabled: false };
    await Promise.all([env.KV.put(`user:${userId}`, JSON.stringify(userData)), env.KV.put(`email:${normalEmail}`, userId)]);
  } else {
    const raw = await env.KV.get(`user:${userId}`);
    if (!raw) return htmlResponse(oauthErrorPage("Account data not found.", frontendUrl));
    userData = JSON.parse(raw);
    if (userData.disabled) return htmlResponse(oauthErrorPage("Account is disabled.", frontendUrl));
    if (!userData.discordId) {
      userData.discordId = String(dcUser.id);
      await env.KV.put(`user:${userId}`, JSON.stringify(userData));
    }
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000).toISOString();
  await env.KV.put(`session:${token}`, JSON.stringify({ userId, role: userData.role, expiresAt }), { expirationTtl: SESSION_TTL_SEC });

  const { passwordHash: _ph, salt: _s, ...safeUser } = userData;
  return htmlResponse(oauthSuccessPage(token, safeUser, frontendUrl));
}
