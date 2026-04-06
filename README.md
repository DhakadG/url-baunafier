# URL Baunafier

> A fast, modern URL shortener with real-time analytics, QR codes, expiry control, and Google OAuth — built entirely on Cloudflare's edge.

**Live →** [snip.losthusky.qzz.io](https://snip.losthusky.qzz.io)

---

## Features

- **Instant shortening** — create short links with custom aliases
- **Click analytics** — country, device, browser, OS, referrer breakdown for every link
- **QR codes** — one-click QR generation for any short link
- **Expiry control** — set links to expire in minutes, hours, or days
- **Google OAuth** — sign in with Google or email/password
- **Google One Tap** — floating "Continue with Google" prompt for zero-friction auth
- **Admin dashboard** — user management, global link control, site-wide stats
- **Dark theme** — minimal, high-contrast UI built without any CSS framework

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite · react-router-dom v6 |
| Backend | Cloudflare Workers (JS) |
| Storage | Cloudflare KV |
| Auth | PBKDF2-SHA-256 passwords · JWT · Google Identity Services |
| Hosting | Cloudflare Pages (frontend) · Cloudflare Workers (API + redirects) |

## Project Structure

```
.
├── frontend/                 # React + Vite SPA
│   ├── public/
│   │   └── icon.svg          # Chain-link app icon
│   ├── src/
│   │   └── App.jsx           # Entire frontend — components, pages, routes
│   ├── index.html
│   └── vite.config.js
├── worker/                   # Cloudflare Worker (API + redirect handler)
│   ├── src/
│   │   └── index.js
│   └── wrangler.toml
└── .gitignore
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm i -g wrangler`)
- A [Cloudflare](https://cloudflare.com) account
- A [Google Cloud](https://console.cloud.google.com) project with OAuth 2.0 credentials

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

# Copy the KV namespace ID into wrangler.toml, then add your vars:
# [vars]
# ADMIN_EMAIL = "you@example.com"
# GOOGLE_CLIENT_ID = "your-google-client-id"

wrangler deploy
```

### 3. Frontend setup

```bash
cd ../frontend
npm install

# Create frontend/.env
echo "VITE_GOOGLE_CLIENT_ID=your-google-client-id" > .env

npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
```

### 4. Deploy frontend to Cloudflare Pages

```bash
wrangler pages deploy dist --project-name url-shortener-frontend
```

## Environment Variables

### Worker (`wrangler.toml` → `[vars]`)

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Email address granted admin access |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |

> Add `KV` namespace binding and `JWT_SECRET` secret via `wrangler secret put JWT_SECRET`.

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Same Google OAuth 2.0 Client ID |

> **Never commit `.env` files.** They are excluded by `.gitignore`.

## API Reference

All endpoints are served from `go.losthusky.qzz.io`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/:code` | — | Redirect to original URL |
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Get JWT token |
| `POST` | `/api/auth/google` | — | Google OAuth exchange |
| `POST` | `/api/shorten` | Bearer | Create short link |
| `GET` | `/api/links` | Bearer | List own links |
| `DELETE` | `/api/links/:code` | Bearer | Delete a link |
| `GET` | `/api/analytics/:code` | Bearer | Click analytics |
| `GET` | `/api/admin/stats` | Admin | Site-wide stats |
| `GET` | `/api/admin/users` | Admin | All users |
| `GET` | `/api/admin/links` | Admin | All links |
| `DELETE` | `/api/admin/links/:code` | Admin | Delete any link |
| `DELETE` | `/api/admin/users/:email` | Admin | Delete a user |

## Legal

- [Privacy Policy](https://snip.losthusky.qzz.io/privacy)
- [Terms of Service](https://snip.losthusky.qzz.io/terms)

## License

MIT © [Dhakad Kumawat](https://github.com/DhakadG)
