import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC } from "../config/constants.js";

export async function checkRateLimit(env, ip) {
  const key = `rate:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - RATE_LIMIT_WINDOW_SEC;
  const raw = await env.KV.get(key);
  let timestamps = raw ? JSON.parse(raw) : [];
  timestamps = timestamps.filter((ts) => ts > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  await env.KV.put(key, JSON.stringify(timestamps), { expirationTtl: RATE_LIMIT_WINDOW_SEC + 5 });
  return true;
}
