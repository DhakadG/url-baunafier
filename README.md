<div align="center">

<!-- Logo -->
<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0a0a0a"/>
  <g fill="none" stroke="#A4F670" stroke-width="6.5" stroke-linecap="round">
    <path d="M38 54 a14 14 0 0 1 0-20l10-10 a14 14 0 0 1 20 20l-6 6"/>
    <path d="M62 46 a14 14 0 0 1 0 20l-10 10 a14 14 0 0 1-20-20l6-6"/>
  </g>
</svg>

# Baunafier

**A fast, full-featured URL shortener with password protection, device routing, OG previews, world-map analytics, UTM breakdown, and social OAuth — deployed entirely on Cloudflare's edge.**

[![Live](https://img.shields.io/badge/live-baunafier.qzz.io-c8ff00?style=flat-square&labelColor=0a0a0a)](https://baunafier.qzz.io)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare&logoColor=fff&labelColor=0a0a0a)](https://workers.cloudflare.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-c8ff00?style=flat-square&labelColor=0a0a0a)](LICENSE)

</div>

---

## Banner Image Prompt

> **Prompt for AI image generation (Midjourney / DALL·E / Stable Diffusion):**
>
> *"Minimalist tech product banner, ultra dark background #0a0a0a, a glowing chartreuse-yellow (#A4F670) chain-link icon centrally placed, the word BAUNAFIER in bold Space Grotesk font below it in off-white #e8e4df, subtitle 'shorten · track · share' in DM Mono monospace below that. Clean edge-to-edge dark gradient, subtle grid lines in #1a1a1a, no gradients on text, high contrast, flat design, 1600×900px, product launch style"*

---

## Features

| Feature | Description |
|---------|-------------|
| **Instant shortening** | Create short links with optional custom aliases — including emoji slugs |
| **Password protection** | Lock any link behind a password; served as a native HTML form (no JS needed) |
| **Max-click limit** | Automatically disable a link after N clicks |
| **Device routing** | Send iOS users to an App Store URL and Android users to a Play Store URL |
| **Social / OG preview** | Custom OG title, description & image shown when a link is shared on social media |
| **World map analytics** | Choropleth map of clicks by country using react-simple-maps |
| **UTM breakdown** | Per-link source / medium / campaign analytics rows |
| **Time-range tabs** | Filter analytics by 24 h, 7 d, 30 d, or all-time |
| **Bot tracking** | Social-crawler clicks counted separately and badged in the analytics panel |
| **Edit modal** | Edit destination URL, password, max clicks, device URLs, and OG fields in-place |
| **QR codes** | One-click QR generation with live preview and download |
| **Expiry control** | Set links to expire after minutes, hours, or days |
| **Social OAuth** | Sign in with Google, GitHub, or Discord |
| **Email auth** | Traditional email + password with PBKDF2-SHA-256 hashing |
| **Admin dashboard** | User management, role control, global link overview |
| **Link toggles** | Enable/disable any link instantly without deleting it |
| **10 expiry pages** | Unique, animated "link disabled" art pages per link |
| **Edge-native** | Zero cold starts — runs on Cloudflare Workers + KV globally |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite · react-router-dom v7 · react-simple-maps |
| Backend | Cloudflare Workers (plain JS, no framework) |
| Storage | Cloudflare KV (sessions, users, links, analytics) |
| Auth | PBKDF2-SHA-256 · KV sessions · Google / GitHub / Discord OAuth |
| Hosting | Cloudflare Pages (frontend) · Cloudflare Workers (API + redirects) |

---

## Project Structure

```
url-baunafier/
├── frontend/
│   ├── public/
│   │   └── icon.svg          # Chain-link favicon (SVG)
│   ├── src/
│   │   └── App.jsx           # All components, pages, and routes (~1 700 lines)
│   ├── index.html
│   └── vite.config.js
├── worker/
│   ├── src/
│   │   └── index.js          # Entire Cloudflare Worker (~1 400 lines)
│   └── wrangler.toml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `npm i -g wrangler`
- A [Cloudflare](https://cloudflare.com) account

### 1. Clone

```bash
git clone https://github.com/DhakadG/url-baunafier.git
cd url-baunafier
```

### 2. Worker setup

```bash
cd worker
npm install

# Create a KV namespace
wrangler kv namespace create KV
# Copy the returned KV namespace ID into wrangler.toml

# Deploy
wrangler deploy
```

Set secrets:

```bash
wrangler secret put JWT_SECRET
# GitHub OAuth (if using):
wrangler secret put GITHUB_CLIENT_SECRET
# Discord OAuth (if using):
wrangler secret put DISCORD_CLIENT_SECRET
```

### 3. Frontend setup

```bash
cd ../frontend
npm install

# Create frontend/.env.local
VITE_API_URL=https://go.baunafier.qzz.io
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

npm run dev        # http://localhost:5173
npm run build      # → dist/
```

### 4. Deploy frontend

```bash
# Cloudflare Pages
wrangler pages deploy dist --project-name url-shortener-frontend --branch prod-v1
```

---

## Environment Variables

### Worker — `wrangler.toml` `[vars]`

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_EMAIL` | ✅ | Email address auto-promoted to admin |
| `GOOGLE_CLIENT_ID` | For Google OAuth | Google OAuth 2.0 Client ID |
| `GITHUB_CLIENT_ID` | For GitHub OAuth | GitHub OAuth App Client ID |
| `DISCORD_CLIENT_ID` | For Discord OAuth | Discord Application Client ID |
| `FRONTEND_URL` | For OAuth | Frontend origin, e.g. `https://baunafier.qzz.io` |

### Worker secrets (`wrangler secret put`)

| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | Random secret for session tokens |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `DISCORD_CLIENT_SECRET` | Discord OAuth2 client secret |

### Frontend — `.env.local`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Worker base URL, e.g. `https://go.baunafier.qzz.io` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |

> **Never commit `.env` or `.env.local` files.** They are excluded by `.gitignore`.

---

## OAuth Setup

### Google

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create **OAuth 2.0 Client ID** (Web application)
2. Authorised JavaScript origin: `https://baunafier.qzz.io`
3. Copy the Client ID into both `wrangler.toml` (`GOOGLE_CLIENT_ID`) and `.env.local` (`VITE_GOOGLE_CLIENT_ID`)

### GitHub

1. [GitHub Settings](https://github.com/settings/developers) → Developer Settings → OAuth Apps → New OAuth App
2. Authorization callback URL: `https://go.baunafier.qzz.io/api/auth/github/callback`
3. Copy Client ID into `wrangler.toml` (`GITHUB_CLIENT_ID`)
4. Run `wrangler secret put GITHUB_CLIENT_SECRET`

### Discord

1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application → OAuth2
2. Redirect URL: `https://go.baunafier.qzz.io/api/auth/discord/callback`
3. Copy Application ID into `wrangler.toml` (`DISCORD_CLIENT_ID`)
4. Run `wrangler secret put DISCORD_CLIENT_SECRET`

---

## API Reference

All endpoints served from `https://go.baunafier.qzz.io`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/:code` | — | Redirect to original URL |
| `POST` | `/api/auth/signup` | — | Create account (email/password) |
| `POST` | `/api/auth/login` | — | Login, receive session token |
| `POST` | `/api/auth/logout` | Bearer | Invalidate session |
| `GET` | `/api/auth/me` | Bearer | Current user info |
| `POST` | `/api/auth/google` | — | Google credential exchange |
| `GET` | `/api/auth/github/init` | — | Begin GitHub OAuth popup flow |
| `GET` | `/api/auth/github/callback` | — | GitHub OAuth callback |
| `GET` | `/api/auth/discord/init` | — | Begin Discord OAuth popup flow |
| `GET` | `/api/auth/discord/callback` | — | Discord OAuth callback |
| `POST` | `/api/shorten` | Bearer | Create short link (password, max_clicks, ios_url, android_url, og_*) |
| `POST` | `/:code` | — | Submit password for a password-protected link |
| `GET` | `/api/links` | Bearer | List own links |
| `PATCH` | `/api/links/:code` | Bearer | Update link (url, password, max_clicks, device urls, og, enabled, expiry) |
| `DELETE` | `/api/links/:code` | Bearer | Delete a link |
| `GET` | `/api/stats/:code` | Bearer | Click analytics (country, device, browser, OS, referrer, UTM, bot_clicks, 24h/7d/30d) |
| `GET` | `/api/admin/stats` | Admin | Site-wide stats |
| `GET` | `/api/admin/users` | Admin | All users |
| `GET` | `/api/admin/links` | Admin | All links |
| `PATCH` | `/api/admin/users/:id` | Admin | Update user role / status |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete user and their links |

---

## Domain Naming

Current domains:

| Purpose | Domain |
|---------|--------|
| Frontend / dashboard | `baunafier.qzz.io` |
| API + redirects (worker) | `go.baunafier.qzz.io` |

**Redirect domain options** (shortest first):

| Domain | Short URL example | Notes |
|--------|------------------|-------|
| `b.qd.je/abc` | 11 chars | Ultra-short, great for sharing |
| `bna.qzz.io/abc` | 14 chars | Abbreviated "Bauna" |
| `bauna.qzz.io/abc` | 16 chars | Natural shortform of Baunafier |
| `go.baunafier.qzz.io/abc` | 24 chars | Current default |

> Update `VITE_API_URL` and the OAuth callback URLs whenever you change the worker domain.

---

## Legal

- [Privacy Policy](https://baunafier.qzz.io/privacy)
- [Terms of Service](https://baunafier.qzz.io/terms)

---

## License

MIT © [Dhakad Kumawat](https://github.com/DhakadG)
