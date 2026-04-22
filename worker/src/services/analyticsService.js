import { MAX_CLICK_LOG } from "../config/constants.js";
import { sha256Hex } from "../utils/encoder.js";

export function parseUA(ua) {
  if (!ua) return { device: "unknown", browser: "unknown", browser_version: "", os: "unknown" };

  let device;
  if (/bot|crawl|spider|Twitterbot|facebookexternalhit|LinkedInBot|TelegramBot|Slackbot|WhatsApp|Discordbot/i.test(ua)) device = "bot";
  else if (/iPad|Tablet/i.test(ua)) device = "tablet";
  else if (/Mobi|Android|iPhone/i.test(ua)) device = "mobile";
  else device = "desktop";

  let browser = "unknown",
    browser_version = "";
  const edgeMatch = ua.match(/Edg(?:e|A|iOS)?\/(\d+)/);
  const operaMatch = ua.match(/(?:OPR|Opera)\/(\d+)/);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+)[^)]*Safari/);

  if (edgeMatch) {
    browser = "Edge";
    browser_version = edgeMatch[1];
  } else if (operaMatch) {
    browser = "Opera";
    browser_version = operaMatch[1];
  } else if (chromeMatch) {
    browser = "Chrome";
    browser_version = chromeMatch[1];
  } else if (firefoxMatch) {
    browser = "Firefox";
    browser_version = firefoxMatch[1];
  } else if (safariMatch) {
    browser = "Safari";
    browser_version = safariMatch[1];
  }

  let os = "unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { device, browser, browser_version, os };
}

function increment(obj, key) {
  obj[key] = (obj[key] || 0) + 1;
}

export function buildAnalyticsSummary(entry) {
  const log = entry.click_log || [];
  const now = Date.now();
  const h24Cutoff = now - 24 * 60 * 60 * 1000;
  const d7Cutoff = now - 7 * 24 * 60 * 60 * 1000;
  const d30Cutoff = now - 30 * 24 * 60 * 60 * 1000;

  const clicks_by_country = {};
  const clicks_by_device = {};
  const clicks_by_browser = {};
  const clicks_by_os = {};
  const clicks_by_referrer = {};
  const clicks_by_utm_source = {};
  const clicks_by_utm_medium = {};
  const clicks_by_utm_campaign = {};
  const clicks_today_by_hour = new Array(24).fill(0);

  let clicks_last_24h = 0,
    clicks_last_7d = 0,
    clicks_last_30d = 0,
    bot_clicks = 0;
  const nowDate = new Date();
  const todayY = nowDate.getUTCFullYear(),
    todayM = nowDate.getUTCMonth(),
    todayD = nowDate.getUTCDate();

  for (const click of log) {
    const ts = new Date(click.ts).getTime();
    if (!isNaN(ts)) {
      if (ts > h24Cutoff) clicks_last_24h++;
      if (ts > d7Cutoff) clicks_last_7d++;
      if (ts > d30Cutoff) clicks_last_30d++;
      const cd = new Date(click.ts);
      if (cd.getUTCFullYear() === todayY && cd.getUTCMonth() === todayM && cd.getUTCDate() === todayD) {
        clicks_today_by_hour[cd.getUTCHours()]++;
      }
    }
    if ((click.device || "") === "bot") bot_clicks++;
    increment(clicks_by_country, click.country || "unknown");
    increment(clicks_by_device, click.device || "unknown");
    increment(clicks_by_browser, click.browser || "unknown");
    increment(clicks_by_os, click.os || "unknown");
    increment(clicks_by_referrer, click.referrer_domain || "direct");
    if (click.utm_source) increment(clicks_by_utm_source, click.utm_source);
    if (click.utm_medium) increment(clicks_by_utm_medium, click.utm_medium);
    if (click.utm_campaign) increment(clicks_by_utm_campaign, click.utm_campaign);
  }

  return {
    clicks_by_country,
    clicks_by_device,
    clicks_by_browser,
    clicks_by_os,
    clicks_by_referrer,
    clicks_by_utm_source,
    clicks_by_utm_medium,
    clicks_by_utm_campaign,
    clicks_last_24h,
    clicks_last_7d,
    clicks_last_30d,
    bot_clicks,
    clicks_today_by_hour,
  };
}

export async function recordClick(entry, code, request, env, keyPrefix = "link:") {
  try {
    const ua = request.headers.get("User-Agent") || "";
    const { device, browser, browser_version, os } = parseUA(ua);
    const country = request.headers.get("CF-IPCountry") || "unknown";
    const city = (request.cf && request.cf.city) || null;
    const region = (request.cf && request.cf.region) || null;

    const refererHeader = request.headers.get("Referer") || null;
    let referrer_domain = "direct";
    if (refererHeader) {
      try {
        referrer_domain = new URL(refererHeader).hostname;
      } catch {
        referrer_domain = "direct";
      }
    }

    const incomingUrl = new URL(request.url);
    const utm_source = incomingUrl.searchParams.get("utm_source") || null;
    const utm_medium = incomingUrl.searchParams.get("utm_medium") || null;
    const utm_campaign = incomingUrl.searchParams.get("utm_campaign") || null;

    const clientIp = request.headers.get("CF-Connecting-IP") || "";
    const ip_hash = (await sha256Hex(clientIp)).slice(0, 16);

    entry.clicks = (entry.clicks || 0) + 1;
    entry.click_log = entry.click_log || [];
    entry.click_log.push({
      ts: new Date().toISOString(),
      country,
      city,
      region,
      device,
      browser,
      browser_version,
      os,
      referrer: refererHeader,
      referrer_domain,
      utm_source,
      utm_medium,
      utm_campaign,
      ip_hash,
    });
    if (entry.click_log.length > MAX_CLICK_LOG) entry.click_log = entry.click_log.slice(entry.click_log.length - MAX_CLICK_LOG);

    const kvOpts = entry.expires_at ? { expiration: Math.floor(new Date(entry.expires_at).getTime() / 1000) } : {};
    await env.KV.put(`${keyPrefix}${code}`, JSON.stringify(entry), kvOpts);
  } catch (err) {
    console.error("[analytics]", err);
  }
}
