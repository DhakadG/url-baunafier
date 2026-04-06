// ============================================================
// Cloudflare Worker — URL Baunafier (ES Module, single file)
// KV namespace binding: env.KV
// Auth: PBKDF2 email+password, session tokens in KV
// ============================================================

// --------------- Constants ----------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const CODE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 7;
const MAX_CLICK_LOG = 500;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SEC = 60;
const SESSION_TTL_SEC = 2592000; // 30 days

// --------------- Response helpers ---------------------------

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// --------------- Crypto / encoding --------------------------

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateCode() {
  const arr = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => CODE_CHARS[b % CODE_CHARS.length])
    .join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashPassword(password, salt) {
  const saltBytes = hexToBytes(salt);
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  return bytesToHex(new Uint8Array(bits));
}

function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

// --------------- Validation ---------------------------------

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidAlias(alias) {
  if (!alias) return false;
  const codepoints = [...alias].length;
  if (codepoints < 2 || codepoints > 40) return false;
  return !/[\s/?#\x00-\x1f\\]/.test(alias);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --------------- Auth helpers -------------------------------

async function getSession(request, env) {
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
async function requireAuth(request, env) {
  const session = await getSession(request, env);
  if (!session) return { error: jsonResponse({ error: "Unauthorized." }, 401) };
  return { session };
}

// Returns { session } or { error: Response }
async function requireAdmin(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return { error };
  if (session.role !== "admin") return { error: jsonResponse({ error: "Forbidden." }, 403) };
  return { session };
}

// --------------- User-Agent parsing -------------------------

function parseUA(ua) {
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

// --------------- Rate limiting ------------------------------

async function checkRateLimit(env, ip) {
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

// --------------- Analytics summary --------------------------

function increment(obj, key) {
  obj[key] = (obj[key] || 0) + 1;
}

function buildAnalyticsSummary(entry) {
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

// --------------- Disabled / Expired pages -------------------

function page(title, body, css, bg = "#0a0a0a") {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100vh;background:${bg};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;overflow:hidden}
.back{position:fixed;top:20px;left:24px;font-family:monospace;font-size:13px;color:#444;text-decoration:none;letter-spacing:.03em}
.back:hover{color:#666}
${css}
</style></head><body><a class="back" href="javascript:history.back()">← go back</a>${body}</body></html>`;
}

function disabledPage(request) {
  const theme = Math.floor(Math.random() * 10);

  // Theme 0 — You're Late (sad)
  const themes = [
    page(
      "You're Late",
      `
<div class="wrap">
  <div class="ticket">
    <div class="ticket-left">
      <div class="label">ADMIT ONE</div>
      <div class="event">This Link</div>
      <div class="seat">Seat: Taken</div>
    </div>
    <div class="ticket-right">
      <div class="stub">VOID</div>
    </div>
  </div>
  <p class="sub">You're late. This link was only valid for so long.<br>Your seat's been given away.</p>
</div>`,
      `@keyframes peel{0%{transform:translateX(0) rotate(0);opacity:1}100%{transform:translateX(120px) rotate(15deg);opacity:0}}
.wrap{text-align:center}
.ticket{display:inline-flex;border-radius:10px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.6);margin-bottom:32px}
.ticket-left{background:#f0a500;color:#1a0f00;padding:30px 28px;min-width:200px}
.label{font-family:monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:.7;margin-bottom:12px}
.event{font-size:28px;font-weight:bold;margin-bottom:8px}
.seat{font-family:monospace;font-size:13px;opacity:.8}
.ticket-right{background:#c8860a;color:#1a0f00;padding:30px 20px;display:flex;align-items:center;border-left:3px dashed rgba(0,0,0,.3);animation:peel 1.2s 0.8s ease-in forwards}
.stub{writing-mode:vertical-rl;font-family:monospace;font-size:22px;font-weight:bold;letter-spacing:4px;opacity:.6}
.sub{color:#8a7060;font-size:16px;line-height:1.7;font-style:italic}`,
      "#1a0f00",
    ),

    // Theme 1 — Gone Girl (sad/dramatic)
    page(
      "Gone Girl",
      `
<div class="wrap">
  <div class="gone">She's gone.</div>
  <div class="url-text" id="ut">This link packed its bags and left.<br>No forwarding address.</div>
  <p class="sub">Don't wait up.</p>
</div>`,
      `@keyframes floatOff{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}
@keyframes glow{0%,100%{text-shadow:0 0 20px rgba(220,50,50,.4)}50%{text-shadow:0 0 50px rgba(220,50,50,.8)}}
.wrap{text-align:center;color:#ddd}
.gone{font-size:72px;font-weight:bold;margin-bottom:32px;animation:glow 2.5s ease-in-out infinite;color:#fff}
.url-text{font-size:18px;color:#aaa;line-height:1.8;margin-bottom:24px}
.sub{font-family:monospace;font-size:13px;color:#444;letter-spacing:.06em}`,
      "#111118",
    ),

    // Theme 2 — Nah Fam (funny)
    page(
      "Nah Fam",
      `
<div class="wrap">
  <div class="shrug">🤷</div>
  <div class="big">Nah fam.</div>
  <p class="sub">This link has been put to rest.<br>Better luck next time.</p>
</div>`,
      `@keyframes bounce{0%,100%{transform:translateY(0) rotate(-3deg)}40%{transform:translateY(-30px) rotate(3deg)}70%{transform:translateY(-15px) rotate(-2deg)}}
@keyframes flash{0%,100%{color:#ffdd00}50%{color:#fff}}
.wrap{text-align:center}
.shrug{font-size:100px;display:block;animation:bounce 1.4s ease-in-out infinite;cursor:default}
.big{font-size:64px;font-weight:900;color:#ffdd00;margin:24px 0 16px;animation:flash 2s ease-in-out infinite;font-family:Arial,sans-serif;letter-spacing:-.02em}
.sub{font-size:18px;color:#887700;line-height:1.7}`,
      "#0d0d00",
    ),

    // Theme 3 — Mission Failed (quirky)
    page(
      "Mission Failed",
      `
<div class="wrap">
  <div class="terminal">SEQUENCE INITIATED<br><span id="ct">5</span></div>
  <div class="stamp">DISABLED</div>
  <p class="sub">This message has self-destructed.<br><span style="font-family:monospace;font-size:12px;color:#4a5240">// No survivors.</span></p>
</div>`,
      `@keyframes stamp{0%{transform:scale(3) rotate(-15deg);opacity:0}60%{transform:scale(.95) rotate(-11deg);opacity:1}80%{transform:scale(1.05) rotate(-11deg)}100%{transform:scale(1) rotate(-11deg);opacity:1}}
@keyframes flicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.2}95%{opacity:1}}
.wrap{text-align:center}
.terminal{font-family:monospace;font-size:14px;color:#7a9a70;letter-spacing:.1em;margin-bottom:40px;animation:flicker 4s infinite}
.stamp{display:inline-block;font-family:Arial,sans-serif;font-size:58px;font-weight:900;color:rgba(220,40,40,.9);border:8px solid rgba(220,40,40,.7);padding:12px 28px;letter-spacing:.15em;border-radius:4px;animation:stamp .6s .4s cubic-bezier(.2,1.4,.5,1) both;transform:rotate(-11deg)}
.sub{margin-top:36px;font-size:15px;color:#6a7a60;line-height:1.8}`,
      "#0d0f0a",
    ),

    // Theme 4 — Landlord Locked It (funny/Hindi)
    page(
      "Taala Lag Gaya",
      `
<div class="wrap">
  <div class="chain-wrap">
    <div class="chain"></div>
    <div class="lock">🔒</div>
  </div>
  <div class="big">Taala lag gaya.</div>
  <p class="sub">Overdue ka mamla hai.<br>Landlord ne band kar diya.</p>
  <p class="note">*Translation: it's locked, bro.</p>
</div>`,
      `@keyframes swing{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}}
.wrap{text-align:center}
.chain-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:24px}
.chain{width:4px;height:60px;background:linear-gradient(to bottom,#888 0%,#888 20%,#555 20%,#555 40%,#888 40%,#888 60%,#555 60%,#555 80%,#888 80%,#888 100%);border-radius:2px}
.lock{font-size:72px;transform-origin:top center;animation:swing 1.6s ease-in-out infinite;display:block}
.big{font-size:44px;font-weight:bold;color:#d4621a;margin:16px 0 12px;font-family:Georgia,serif}
.sub{font-size:17px;color:#8a6040;line-height:1.8}
.note{font-family:monospace;font-size:11px;color:#5a4030;margin-top:16px;font-style:italic}`,
      "#12080200",
    ),

    // Theme 5 — 404 Feelings (sad/ironic)
    page(
      "404: Feelings Not Found",
      `
<div class="wrap">
  <div class="heart-wrap">
    <div class="heart heart-main">❤</div>
    <div class="heart heart-r">❤</div>
    <div class="heart heart-c">❤</div>
  </div>
  <div class="big">404: Feelings not found.</div>
  <p class="sub">This link caught feelings and disabled itself.<br>We don't talk about it.</p>
</div>`,
      `@keyframes glitch1{0%,90%,100%{transform:translate(0)}91%{transform:translate(-4px,1px)}93%{transform:translate(4px,-1px)}95%{transform:translate(-2px,2px)}}
@keyframes glitch2{0%,90%,100%{transform:translate(0);opacity:0}91%{transform:translate(4px,0);opacity:.5}93%{transform:translate(-4px,0);opacity:.5}95%{transform:translate(0);opacity:0}}
@keyframes glitch3{0%,90%,100%{transform:translate(0);opacity:0}91%{transform:translate(-4px,0);opacity:.4}93%{transform:translate(4px,0);opacity:.4}95%{transform:translate(0);opacity:0}}
.wrap{text-align:center;position:relative}
.heart-wrap{position:relative;display:inline-block;margin-bottom:24px}
.heart{font-size:90px;line-height:1;display:block}
.heart-main{animation:glitch1 3s infinite;position:relative}
.heart-r{position:absolute;top:0;left:0;color:#ff0055;animation:glitch2 3s infinite}
.heart-c{position:absolute;top:0;left:0;color:#00ffff;animation:glitch3 3s infinite}
.big{font-size:36px;font-weight:bold;color:#ff69a0;margin-bottom:16px;font-family:Arial,sans-serif}
.sub{font-size:17px;color:#7a4060;line-height:1.8}`,
      "#110008",
    ),

    // Theme 6 — Bauna Ho Gaya (Hindi quirky)
    page(
      "Bauna Ho Gaya",
      `
<div class="wrap">
  <div class="url-shrink">https://baunafier.qzz.io/...</div>
  <div class="big">Bauna ho gaya.</div>
  <p class="sub">Link ne chhota hona bhi band kar diya.</p>
  <p class="note">*bauna = dwarf / short in Hindi</p>
</div>`,
      `@keyframes shrink{0%{font-size:28px;opacity:1;letter-spacing:.05em}70%{font-size:6px;opacity:.4;letter-spacing:-.05em}100%{font-size:0px;opacity:0;letter-spacing:0}}
@keyframes pop{0%{transform:scale(.8);opacity:0}100%{transform:scale(1);opacity:1}}
.wrap{text-align:center}
.url-shrink{font-family:monospace;color:#A4F670;animation:shrink 2.5s 0.5s forwards;white-space:nowrap;overflow:hidden;display:inline-block;margin-bottom:32px;min-height:36px}
.big{font-size:52px;font-weight:bold;color:#A4F670;margin-bottom:16px;animation:pop .5s 3.5s both}
.sub{font-size:17px;color:#6a8000;line-height:1.7;animation:pop .5s 3.7s both;opacity:0}
.note{font-family:monospace;font-size:11px;color:#3a4a00;margin-top:16px;animation:pop .5s 4s both;opacity:0;font-style:italic}`,
      "#060800",
    ),

    // Theme 7 — The Velvet Rope (funny)
    page(
      "Not on the List",
      `
<div class="wrap">
  <svg class="bouncer" viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="30" r="24" fill="#2a1a4a"/>
    <rect x="20" y="60" width="80" height="90" rx="10" fill="#1a0a30"/>
    <line class="arm-l" x1="20" y1="95" x2="60" y2="95" stroke="#2a1a4a" stroke-width="16" stroke-linecap="round"/>
    <line class="arm-r" x1="100" y1="95" x2="60" y2="95" stroke="#2a1a4a" stroke-width="16" stroke-linecap="round"/>
    <rect x="48" y="88" width="24" height="14" rx="4" fill="#3a2a5a"/>
  </svg>
  <div class="big">You're not on the list.</div>
  <p class="sub">This link is VIP only.<br>And VIP is closed. Forever.</p>
</div>`,
      `@keyframes headshake{0%,100%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(6px)}45%{transform:translateX(-4px)}60%{transform:translateX(4px)}75%{transform:translateX(-2px)}}
@keyframes ropeIn{0%,100%{opacity:.5;transform:scaleX(.95)}50%{opacity:1;transform:scaleX(1.05)}}
.wrap{text-align:center}
.bouncer{width:120px;height:180px;margin-bottom:24px}
.bouncer circle{animation:headshake 2.5s ease-in-out infinite}
.big{font-size:40px;font-weight:bold;color:#c8a0ff;margin-bottom:16px;font-family:Arial,sans-serif}
.sub{font-size:17px;color:#5a4070;line-height:1.8}`,
      "#06000f",
    ),

    // Theme 8 — Retired (quirky/warm)
    page(
      "Retired. Do Not Disturb.",
      `
<div class="wrap">
  <svg class="chair" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 100 Q60 60 110 100" stroke="#8a6040" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="25" y="100" width="70" height="8" rx="4" fill="#6a4820"/>
    <rect x="30" y="40" width="60" height="60" rx="8" fill="#7a5030"/>
    <rect x="25" y="36" width="70" height="16" rx="6" fill="#8a6040"/>
    <line x1="30" y1="108" x2="20" y2="138" stroke="#5a3818" stroke-width="7" stroke-linecap="round"/>
    <line x1="90" y1="108" x2="100" y2="138" stroke="#5a3818" stroke-width="7" stroke-linecap="round"/>
  </svg>
  <div class="big">Retired. Do not disturb.</div>
  <p class="sub">This link worked hard for many years.</p>
  <p class="sub2">It's earned its rest. Please. It just wants to rock in peace.</p>
</div>`,
      `@keyframes rock{0%,100%{transform:rotate(-8deg) translateX(-4px)}50%{transform:rotate(8deg) translateX(4px)}}
.wrap{text-align:center}
.chair{width:120px;height:140px;margin-bottom:20px;transform-origin:bottom center;animation:rock 2.2s ease-in-out infinite}
.big{font-size:36px;font-weight:bold;color:#d4b896;margin-bottom:14px}
.sub{font-size:16px;color:#8a7060;line-height:1.7}
.sub2{font-size:13px;color:#6a5040;margin-top:10px;font-style:italic}`,
      "#100800",
    ),

    // Theme 9 — Oops I Disabled It Again (funny/Y2K)
    page(
      "Oops! I Disabled It Again",
      `
<div class="wrap">
  <div class="sparkles" id="sp"></div>
  <div class="big">Oops!<br>I disabled it again.</div>
  <p class="sub">I played with your link, got lost in the game.</p>
  <p class="note">(Not a real Britney quote. But you get it.)</p>
</div>
<script>
const sp=document.getElementById('sp');
for(let i=0;i<30;i++){
  const s=document.createElement('span');
  s.textContent='✦';
  s.style.cssText='position:fixed;top:-20px;font-size:'+(Math.random()*20+8)+'px;left:'+(Math.random()*100)+'vw;animation:fall '+(Math.random()*4+2)+'s '+(Math.random()*3)+'s linear infinite;color:hsl('+(Math.random()*60+290)+',100%,75%)';
  sp.appendChild(s);
}
</script>`,
      `@keyframes fall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
@keyframes pulse{0%,100%{text-shadow:0 0 20px #ff69b4,0 0 40px #ff1493}50%{text-shadow:0 0 40px #ff69b4,0 0 80px #ff1493,0 0 100px #ff69b4}}
.wrap{text-align:center;position:relative;z-index:1}
.big{font-size:52px;font-weight:900;color:#ff69b4;line-height:1.15;margin-bottom:24px;animation:pulse 2s ease-in-out infinite;font-family:Arial,sans-serif}
.sub{font-size:18px;color:#c050a0;line-height:1.7}
.note{font-family:monospace;font-size:11px;color:#7a3060;margin-top:16px;font-style:italic}`,
      "#0d0008",
    ),
  ];

  return htmlResponse(themes[theme], 451);
}

function expiredPage() {
  const html = page(
    "Time's Up",
    `
<div class="wrap">
  <div class="clock">⏰</div>
  <div class="big">Time's up.</div>
  <p class="sub">This link has expired and is no longer available.</p>
</div>`,
    `@keyframes tick{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
.wrap{text-align:center}
.clock{font-size:90px;display:block;margin-bottom:24px;animation:tick 1s ease-in-out infinite}
.big{font-size:52px;font-weight:bold;color:#888;margin-bottom:16px}
.sub{font-size:17px;color:#555;line-height:1.7}`,
    "#0a0a0a",
  );
  return htmlResponse(html, 410);
}

// --------------- Auth handlers ------------------------------

/** POST /api/auth/signup */
async function handleSignup(request, env) {
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

// --------------- OAuth popup helpers ------------------------

function oauthSuccessPage(token, user, frontendUrl) {
  const origin = frontendUrl || "*";
  const data = JSON.stringify({ type: "OAUTH_SUCCESS", token, user });
  return `<!DOCTYPE html><html><head><title>Signing in\u2026</title>
<style>body{background:#0a0a0a;color:#888;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;font-size:14px;margin:0}</style>
</head><body><p>Signing you in\u2026</p>
<script>(function(){try{if(window.opener){window.opener.postMessage(${data},${JSON.stringify(origin)});setTimeout(function(){window.close();},300);}else{window.location.href=${JSON.stringify((frontendUrl || "") + "/dashboard")};}}catch(e){window.location.href=${JSON.stringify((frontendUrl || "") + "/dashboard")};}})();<\/script>
</body></html>`;
}

function oauthErrorPage(error, frontendUrl) {
  const origin = frontendUrl || "*";
  const data = JSON.stringify({ type: "OAUTH_ERROR", error });
  return `<!DOCTYPE html><html><head><title>Auth Error</title>
<style>body{background:#0a0a0a;color:#f44;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;font-size:14px;margin:0}</style>
</head><body><p>Auth error \u2014 please close this window and try again.</p>
<script>(function(){try{if(window.opener){window.opener.postMessage(${data},${JSON.stringify(origin)});setTimeout(function(){window.close();},300);}else{window.location.href=${JSON.stringify((frontendUrl || "") + "/login")};}}catch(e){document.querySelector('p').textContent='Auth error: '+${JSON.stringify(String(error))};;}})();<\/script>
</body></html>`;
}

// --------------- GitHub OAuth ---------------------------

/** GET /api/auth/github/init */
async function handleGithubInit(request, env) {
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
async function handleGithubCallback(request, env) {
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

// --------------- Discord OAuth --------------------------

/** GET /api/auth/discord/init */
async function handleDiscordInit(request, env) {
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
async function handleDiscordCallback(request, env) {
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

/** POST /api/auth/google — verify Google ID token, find/create user, return session */
async function handleGoogleAuth(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON." }, 400);
  }
  const { credential } = body;
  if (!credential) return jsonResponse({ error: "Missing credential." }, 400);

  // Verify the ID token with Google's tokeninfo endpoint
  const tokenResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!tokenResp.ok) return jsonResponse({ error: "Invalid Google token." }, 401);
  const info = await tokenResp.json();

  // Validate audience against our client ID (if configured)
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
    // Create new user (Google-only account — no password)
    userId = "usr_" + generateToken().slice(0, 12);
    const role = env.ADMIN_EMAIL && normalEmail === env.ADMIN_EMAIL.toLowerCase().trim() ? "admin" : "user";
    userData = {
      id: userId,
      email: normalEmail,
      passwordHash: null,
      salt: null,
      googleId: info.sub,
      role,
      created_at: new Date().toISOString(),
      disabled: false,
    };
    await Promise.all([env.KV.put(`user:${userId}`, JSON.stringify(userData)), env.KV.put(`email:${normalEmail}`, userId)]);
  } else {
    const raw = await env.KV.get(`user:${userId}`);
    if (!raw) return jsonResponse({ error: "Account not found." }, 404);
    userData = JSON.parse(raw);
    if (userData.disabled) return jsonResponse({ error: "Account is disabled." }, 403);
    // Attach googleId if not already set
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

/** POST /api/auth/login */
async function handleLogin(request, env) {
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
async function handleLogout(request, env) {
  const auth = request.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    await env.KV.delete(`session:${token}`);
  }
  return jsonResponse({ success: true });
}

/** GET /api/auth/me */
async function handleMe(request, env) {
  const { session, error } = await requireAuth(request, env);
  if (error) return error;
  const raw = await env.KV.get(`user:${session.userId}`);
  if (!raw) return jsonResponse({ error: "User not found." }, 404);
  const user = JSON.parse(raw);
  return jsonResponse({ id: user.id, email: user.email, role: user.role, created_at: user.created_at, disabled: user.disabled });
}

// --------------- Link handlers (auth-gated) -----------------

/** POST /api/shorten */
async function handleShorten(request, env) {
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
        // Only return existing if owned by same user
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
async function handleListLinks(request, env) {
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
      // Users only see their own; admins see all
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
async function handleGetStats(code, request, env) {
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
async function handleUpdateLink(code, request, env) {
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
async function handleDeleteLink(code, request, env) {
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

// --------------- Admin handlers -----------------------------

/** GET /api/admin/stats */
async function handleAdminStats(request, env) {
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
async function handleAdminUsers(request, env) {
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
async function handleAdminUpdateUser(userId, request, env) {
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
async function handleAdminDeleteUser(userId, request, env) {
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
async function handleAdminLinks(request, env) {
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

// --------------- Analytics recording helper ----------------

async function recordClick(entry, code, request, env) {
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
    await env.KV.put(`link:${code}`, JSON.stringify(entry), kvOpts);
  } catch (err) {
    console.error("[analytics]", err);
  }
}

// --------------- Password-protected page -------------------

function passwordFormPage(code, errorMsg = "") {
  const errHtml = errorMsg
    ? `<div style="color:#ff4444;font-family:monospace;font-size:13px;margin-bottom:12px;padding:10px 14px;border:1px solid #ff444433;border-radius:6px;background:#ff44440d">${errorMsg}</div>`
    : "";
  return htmlResponse(
    page(
      "Protected link",
      `<div style="max-width:380px;margin:0 auto;padding:40px 0">
      <div style="font-size:36px;margin-bottom:16px">🔒</div>
      <h1 style="font-family:monospace;font-size:22px;color:#e8e4df;margin-bottom:8px">Password required</h1>
      <p style="font-family:monospace;font-size:13px;color:#666;margin-bottom:28px">This link is protected. Enter the password to continue.</p>
      ${errHtml}
      <form method="POST" action="/${encodeURIComponent(code)}" style="display:flex;flex-direction:column;gap:12px">
        <input name="password" type="password" placeholder="Enter password" autofocus
          style="background:#111;border:1px solid #2a2a2a;border-radius:7px;color:#e8e4df;font-family:monospace;font-size:14px;padding:11px 14px;outline:none"
          onfocus="this.style.borderColor='#A4F670'" onblur="this.style.borderColor='#2a2a2a'" />
        <button type="submit"
          style="background:#A4F670;color:#000;border:none;border-radius:7px;font-family:monospace;font-size:14px;font-weight:700;padding:11px 0;cursor:pointer">
          Unlock ✦
        </button>
      </form>
    </div>`,
    ),
    200,
  );
}

// --------------- OpenGraph preview page --------------------

function ogPreviewPage(link, origin) {
  const title = link.og_title || "Shared link";
  const desc = link.og_description || `Visit: ${link.original_url}`;
  const img = link.og_image || "";
  const url = `${origin}/${encodeURIComponent(link.code)}`;
  const dest = link.original_url;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return htmlResponse(
    `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${img ? `<meta property="og:image" content="${esc(img)}">` : ""}
<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${img ? `<meta name="twitter:image" content="${esc(img)}">` : ""}
<title>${esc(title)}</title>
<script>window.location.replace(${JSON.stringify(dest)});</script>
</head><body style="background:#0a0a0a;color:#e8e4df;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center"><div style="font-size:40px;margin-bottom:16px">↗</div>
<p style="color:#666;font-size:13px">Redirecting…<br><a href="${esc(dest)}" style="color:#A4F670">${esc(dest.length > 60 ? dest.slice(0, 60) + "…" : dest)}</a></p></div>
</body></html>`,
    200,
  );
}

// --------------- Redirect (no auth for end-users) -----------

async function handleRedirect(code, request, env, ctx) {
  const raw = await env.KV.get(`link:${code}`);
  if (!raw)
    return htmlResponse(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="background:#0a0a0a;color:#555;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;text-align:center"><div><div style="font-size:48px;margin-bottom:16px">🔍</div><div style="font-size:24px;color:#888">Link not found.</div><a href="/" style="display:inline-block;margin-top:24px;color:#A4F670;font-size:13px;text-decoration:none">← go back</a></div></body></html>`,
      404,
    );

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

// --------------- Password form submit -----------------------

async function handlePasswordSubmit(code, request, env, ctx) {
  const raw = await env.KV.get(`link:${code}`);
  if (!raw)
    return htmlResponse(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="background:#0a0a0a;color:#555;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;text-align:center"><div><div style="font-size:48px;margin-bottom:16px">🔍</div><div style="font-size:24px;color:#888">Link not found.</div><a href="/" style="display:inline-block;margin-top:24px;color:#A4F670;font-size:13px;text-decoration:none">← go back</a></div></body></html>`,
      404,
    );

  const entry = JSON.parse(raw);

  if (entry.expires_at && new Date(entry.expires_at) < new Date()) return expiredPage();
  if (entry.max_clicks && (entry.clicks || 0) >= entry.max_clicks) return disabledPage(request);
  if (entry.enabled === false) return disabledPage(request);

  if (!entry.password_hash) {
    // No password on this link — redirect normally
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

  // Correct — apply device routing and redirect
  const ua = request.headers.get("User-Agent") || "";
  const { os } = parseUA(ua);
  let destination = entry.original_url;
  if (entry.ios_url && os === "iOS") destination = entry.ios_url;
  if (entry.android_url && os === "Android") destination = entry.android_url;

  if (ctx && ctx.waitUntil) ctx.waitUntil(recordClick(entry, code, request, env));
  return Response.redirect(destination, 302);
}

// --------------- Main fetch handler -------------------------

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
      try {
        statsCode = decodeURIComponent(statsMatch[1]);
      } catch {
        statsCode = statsMatch[1];
      }
      return handleGetStats(statsCode, request, env);
    }

    const linksMatch = path.match(/^\/api\/links\/([^/?#\s]{2,80})$/);
    if (linksMatch) {
      let linkCode;
      try {
        linkCode = decodeURIComponent(linksMatch[1]);
      } catch {
        linkCode = linksMatch[1];
      }
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

    // Redirect / password submit (supports emoji slugs via percent-encoding)
    const redirectMatch = path.match(/^\/([^/?#\s]{1,80})$/);
    if (redirectMatch) {
      let code;
      try {
        code = decodeURIComponent(redirectMatch[1]);
      } catch {
        code = redirectMatch[1];
      }
      if (method === "POST") return handlePasswordSubmit(code, request, env, ctx);
      if (method === "GET") return handleRedirect(code, request, env, ctx);
    }

    return jsonResponse({ error: "Not found." }, 404);
  },
};
