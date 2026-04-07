import { htmlResponse } from "../utils/response.js";
import { hashPassword } from "../utils/encoder.js";
import { parseUA } from "../services/analyticsService.js";
import { recordClick } from "../services/analyticsService.js";
import { disabledPage, expiredPage, passwordFormPage, ogPreviewPage } from "../utils/pages.js";

const NOT_FOUND_HTML = `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="background:#0a0a0a;color:#555;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;text-align:center"><div><div style="font-size:48px;margin-bottom:16px">🔍</div><div style="font-size:24px;color:#888">Link not found.</div><a href="/" style="display:inline-block;margin-top:24px;color:#A4F670;font-size:13px;text-decoration:none">← go back</a></div></body></html>`;

export async function handleRedirect(code, request, env, ctx) {
  const raw = await env.KV.get(`link:${code}`);
  if (!raw) return htmlResponse(NOT_FOUND_HTML, 404);

  const entry = JSON.parse(raw);

  // Priority chain
  if (entry.expires_at && new Date(entry.expires_at) < new Date()) return expiredPage();
  if (entry.max_clicks && (entry.clicks || 0) >= entry.max_clicks) return disabledPage(request);
  if (entry.enabled === false) return disabledPage(request);

  const ua = request.headers.get("User-Agent") || "";

  // Social bot → serve OG preview without counting analytics
  const isSocialBot = /Twitterbot|facebookexternalhit|LinkedInBot|TelegramBot|Slackbot|WhatsApp|Discordbot/i.test(ua);
  if (isSocialBot) {
    const origin = new URL(request.url).origin;
    return ogPreviewPage(entry, origin);
  }

  // Password check
  if (entry.password_hash) {
    return passwordFormPage(code);
  }

  // Device routing
  const { os } = parseUA(ua);
  if (entry.ios_url && os === "iOS") {
    if (ctx && ctx.waitUntil) ctx.waitUntil(recordClick(entry, code, request, env));
    return Response.redirect(entry.ios_url, 302);
  }
  if (entry.android_url && os === "Android") {
    if (ctx && ctx.waitUntil) ctx.waitUntil(recordClick(entry, code, request, env));
    return Response.redirect(entry.android_url, 302);
  }

  // Normal redirect
  if (ctx && ctx.waitUntil) ctx.waitUntil(recordClick(entry, code, request, env));
  return Response.redirect(entry.original_url, 302);
}

export async function handlePasswordSubmit(code, request, env, ctx) {
  const raw = await env.KV.get(`link:${code}`);
  if (!raw) return htmlResponse(NOT_FOUND_HTML, 404);

  const entry = JSON.parse(raw);

  if (entry.expires_at && new Date(entry.expires_at) < new Date()) return expiredPage();
  if (entry.max_clicks && (entry.clicks || 0) >= entry.max_clicks) return disabledPage(request);
  if (entry.enabled === false) return disabledPage(request);

  if (!entry.password_hash) {
    if (ctx && ctx.waitUntil) ctx.waitUntil(recordClick(entry, code, request, env));
    return Response.redirect(entry.original_url, 302);
  }

  let submittedPassword = "";
  try {
    const text = await request.text();
    submittedPassword = new URLSearchParams(text).get("password") || "";
  } catch {
    return passwordFormPage(code, "Invalid form submission.");
  }

  if (!submittedPassword) return passwordFormPage(code, "Password is required.");

  const hash = await hashPassword(submittedPassword, entry.password_salt);
  if (hash !== entry.password_hash) return passwordFormPage(code, "Incorrect password. Try again.");

  const ua = request.headers.get("User-Agent") || "";
  const { os } = parseUA(ua);
  let destination = entry.original_url;
  if (entry.ios_url && os === "iOS") destination = entry.ios_url;
  if (entry.android_url && os === "Android") destination = entry.android_url;

  if (ctx && ctx.waitUntil) ctx.waitUntil(recordClick(entry, code, request, env));
  return Response.redirect(destination, 302);
}
