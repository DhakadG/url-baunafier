import { htmlResponse } from "./response.js";

export function page(title, body, css, bg = "#0a0a0a") {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100vh;background:${bg};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;overflow:hidden}
.back{position:fixed;top:20px;left:24px;font-family:monospace;font-size:13px;color:#444;text-decoration:none;letter-spacing:.03em}
.back:hover{color:#666}
${css}
</style></head><body><a class="back" href="javascript:history.back()">← go back</a>${body}</body></html>`;
}

export function disabledPage(request) {
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

export function expiredPage() {
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

export function passwordFormPage(code, errorMsg = "") {
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

export function ogPreviewPage(link, origin) {
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
<script>window.location.replace(${JSON.stringify(dest)});<\/script>
</head><body style="background:#0a0a0a;color:#e8e4df;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center"><div style="font-size:40px;margin-bottom:16px">↗</div>
<p style="color:#666;font-size:13px">Redirecting…<br><a href="${esc(dest)}" style="color:#A4F670">${esc(dest.length > 60 ? dest.slice(0, 60) + "…" : dest)}</a></p></div>
</body></html>`,
    200,
  );
}

export function oauthSuccessPage(token, user, frontendUrl) {
  const origin = frontendUrl || "*";
  const data = JSON.stringify({ type: "OAUTH_SUCCESS", token, user });
  return `<!DOCTYPE html><html><head><title>Signing in\u2026</title>
<style>body{background:#0a0a0a;color:#888;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;font-size:14px;margin:0}</style>
</head><body><p>Signing you in\u2026</p>
<script>(function(){try{if(window.opener){window.opener.postMessage(${data},${JSON.stringify(origin)});setTimeout(function(){window.close();},300);}else{window.location.href=${JSON.stringify((frontendUrl || "") + "/dashboard")};}}catch(e){window.location.href=${JSON.stringify((frontendUrl || "") + "/dashboard")};}})();<\/script>
</body></html>`;
}

export function oauthErrorPage(error, frontendUrl) {
  const origin = frontendUrl || "*";
  const data = JSON.stringify({ type: "OAUTH_ERROR", error });
  return `<!DOCTYPE html><html><head><title>Auth Error</title>
<style>body{background:#0a0a0a;color:#f44;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;font-size:14px;margin:0}</style>
</head><body><p>Auth error \u2014 please close this window and try again.</p>
<script>(function(){try{if(window.opener){window.opener.postMessage(${data},${JSON.stringify(origin)});setTimeout(function(){window.close();},300);}else{window.location.href=${JSON.stringify((frontendUrl || "") + "/login")};}}catch(e){document.querySelector('p').textContent='Auth error: '+${JSON.stringify(String(error))};;}})();<\/script>
</body></html>`;
}

export function qrNotFoundPage(slug) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return htmlResponse(
    page(
      "QR Code Not Found",
      `<div class="wrap">
  <div class="qr-icon">▦</div>
  <div class="big">QR code not found.</div>
  <p class="sub">The code <span class="slug">/${esc(slug)}</span> doesn't exist or has been removed.</p>
</div>`,
      `@keyframes fadeIn{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
.wrap{text-align:center;animation:fadeIn .4s ease both}
.qr-icon{font-size:80px;display:block;margin-bottom:20px;color:#2a2a2a;letter-spacing:-.05em;line-height:1}
.big{font-size:40px;font-weight:bold;color:#555;margin-bottom:14px;font-family:monospace}
.sub{font-size:15px;color:#444;line-height:1.7;font-family:monospace}
.slug{color:#A4F670;background:#A4F67011;padding:2px 8px;border-radius:4px}`,
      "#0a0a0a",
    ),
    404,
  );
}

export function qrPausedPage(slug, name) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return htmlResponse(
    page(
      "QR Code Paused",
      `<div class="wrap">
  <div class="qr-icon">⏸</div>
  <div class="big">${esc(name || slug)}</div>
  <p class="sub">This QR code is temporarily paused and not redirecting right now.<br>Check back soon.</p>
</div>`,
      `@keyframes pulse{0%,100%{opacity:.7}50%{opacity:1}}
.wrap{text-align:center}
.qr-icon{font-size:72px;display:block;margin-bottom:20px;animation:pulse 2s ease-in-out infinite}
.big{font-size:34px;font-weight:bold;color:#e8e4df;margin-bottom:14px;font-family:monospace}
.sub{font-size:15px;color:#555;line-height:1.8;font-family:monospace}`,
      "#0a0a0a",
    ),
    200,
  );
}
