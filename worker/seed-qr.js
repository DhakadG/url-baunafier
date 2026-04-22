#!/usr/bin/env node
/**
 * URL-Baunafier — QR Redirect Seed Script
 * Seeds the 8 ARTH ATELIER F/W 26 fabric QR redirects into the existing KV namespace.
 *
 * Usage (run from the worker/ directory):
 *   node ../seed-qr.js
 *   node ../seed-qr.js --env production
 *
 * Requirements:
 *   - wrangler must be installed and you must be logged in (wrangler login)
 *   - The KV namespace binding must be named "KV" (matches wrangler.toml)
 *
 * The script sets ownerId to the ADMIN_EMAIL var from wrangler.toml by looking it
 * up at runtime. If you want a specific ownerId, set SEED_OWNER_ID below.
 *
 * NOTE: This is a one-time setup script. Re-running it will overwrite existing entries.
 */

const { execSync } = require("child_process");

const args = process.argv.slice(2);
const envFlag = args.includes("--env") ? `--env ${args[args.indexOf("--env") + 1]}` : "";

// The owner ID to assign to all seeded QR codes.
// Set this to your admin user's ID from KV, or leave empty — the entries will work
// regardless (admin can manage all QR codes regardless of ownerId).
const SEED_OWNER_ID = process.env.SEED_OWNER_ID || "seed-admin";

const now = new Date().toISOString();

const redirects = [
  {
    slug: "organic-wool",
    name: "Organic Wool",
    url: "https://arth.shop/pages/provenance-organic-wool",
    notes: "F/W 26 · Blazer, Trouser, Mini Skirt, Mini Boxer",
  },
  {
    slug: "organic-twill",
    name: "Organic Twill",
    url: "https://arth.shop/pages/provenance-organic-twill",
    notes: "F/W 26 · Twill Shorts, Twill Jacket",
  },
  {
    slug: "organic-waffle",
    name: "Organic Waffle",
    url: "https://arth.shop/pages/provenance-organic-waffle",
    notes: "F/W 26 · Waffle Top, Waffle Skirt",
  },
  {
    slug: "corduroy",
    name: "Corduroy",
    url: "https://arth.shop/pages/provenance-corduroy",
    notes: "F/W 26 · Corduroy Pants",
  },
  {
    slug: "organic-canvas",
    name: "Organic Canvas",
    url: "https://arth.shop/pages/provenance-organic-canvas",
    notes: "F/W 26 · Mirror Dress",
  },
  {
    slug: "organic-cotton-jersey",
    name: "Organic Cotton Jersey",
    url: "https://arth.shop/pages/provenance-organic-cotton-jersey",
    notes: "F/W 26 · T-Shirts",
  },
  {
    slug: "banana-fabric",
    name: "Banana Fabric",
    url: "https://arth.shop/pages/provenance-banana-fabric",
    notes: "F/W 26 · Layered Top, Chikankari Top",
  },
  {
    slug: "organic-cotton-poplin",
    name: "Organic Cotton Poplin",
    url: "https://arth.shop/pages/provenance-organic-cotton-poplin",
    notes: "F/W 26 · Scarf Shirt",
  },
];

console.log(`\nSeeding ${redirects.length} QR redirects${envFlag ? ` (${envFlag})` : ""}...\n`);

for (const r of redirects) {
  const entry = {
    slug: r.slug,
    name: r.name,
    url: r.url,
    notes: r.notes,
    active: true,
    ownerId: SEED_OWNER_ID,
    created: now,
    updated: now,
    clicks: 0,
    click_log: [],
  };

  // Escape single quotes in value for shell safety
  const value = JSON.stringify(entry).replace(/'/g, "'\\''");
  const cmd = `wrangler kv key put --binding KV ${envFlag} "qr:${r.slug}" '${value}'`;

  try {
    execSync(cmd, { stdio: "inherit", cwd: __dirname + "/worker" });
    console.log(`   ✓ qr:${r.slug}  →  ${r.url}`);
  } catch {
    console.error(`   ✗ Failed to seed qr:${r.slug}`);
  }
}

console.log("\nDone. QR codes are live at https://go.baunafier.qzz.io/qr/<slug>\n");
