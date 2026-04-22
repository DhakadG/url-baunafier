// ── Escape helpers ─────────────────────────────────────────────────────────

function escapeChars(val, chars) {
  if (!val) return "";
  return val.replace(new RegExp(`([${chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}])`, "g"), "\\$1");
}

const escVCard = (v) => escapeChars(v, "\\,;");
const escWiFi = (v) => escapeChars(v, "\\;,:\"'");
const escICal = (v) => escapeChars(v, "\\,;");

function toICalDT(dt) {
  try {
    const d = typeof dt === "string" ? new Date(dt) : dt;
    if (isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
  } catch {
    return "";
  }
}

function fromICalDT(s) {
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!m) return s;
  const [, y, mo, d, h, mi, sec] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${sec}${s.endsWith("Z") ? "Z" : ""}`;
}

// ── Generators ─────────────────────────────────────────────────────────────

export function encodeText({ text }) {
  return text || "";
}

export function encodeUrl({ url }) {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

export function encodeEmail({ address, subject, body, cc, bcc }) {
  if (!address) return "";
  const parts = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  if (cc) parts.push(`cc=${encodeURIComponent(cc)}`);
  if (bcc) parts.push(`bcc=${encodeURIComponent(bcc)}`);
  return `mailto:${address}${parts.length ? "?" + parts.join("&") : ""}`;
}

export function encodePhone({ phone }) {
  return phone ? `tel:${phone}` : "";
}

export function encodeSms({ phone, message }) {
  return phone ? `SMSTO:${phone}:${message || ""}` : "";
}

export function encodeWifi({ ssid, encryption = "WPA", password, hidden }) {
  if (!ssid) return "";
  const s = escWiFi(ssid);
  const h = hidden ? "H:true;" : "";
  if (encryption === "nopass") return `WIFI:T:nopass;S:${s};;${h};`;
  return `WIFI:T:${encryption};S:${s};P:${escWiFi(password || "")};${h};`;
}

export function encodeVCard({
  firstName = "",
  lastName = "",
  org = "",
  position = "",
  phoneWork = "",
  phonePrivate = "",
  phoneMobile = "",
  email = "",
  website = "",
  street = "",
  zipcode = "",
  city = "",
  state = "",
  country = "",
  version = "3",
}) {
  const lines = ["BEGIN:VCARD"];
  lines.push(`VERSION:${version === "2" ? "2.1" : version === "4" ? "4.0" : "3.0"}`);
  const fn = escVCard(firstName),
    ln = escVCard(lastName);
  if (fn || ln) {
    lines.push(`N:${ln};${fn};;;`);
    lines.push(`FN:${(fn + " " + ln).trim()}`);
  }
  if (org) lines.push(`ORG:${escVCard(org)}`);
  if (position) lines.push(`TITLE:${escVCard(position)}`);
  const v4 = version === "4",
    v2 = version === "2";
  if (phoneWork) lines.push(v4 ? `TEL;TYPE=work,voice;VALUE=uri:tel:${escVCard(phoneWork)}` : v2 ? `TEL;WORK;VOICE:${escVCard(phoneWork)}` : `TEL;TYPE=WORK,VOICE:${escVCard(phoneWork)}`);
  if (phonePrivate) lines.push(v4 ? `TEL;TYPE=home,voice;VALUE=uri:tel:${escVCard(phonePrivate)}` : v2 ? `TEL;HOME;VOICE:${escVCard(phonePrivate)}` : `TEL;TYPE=HOME,VOICE:${escVCard(phonePrivate)}`);
  if (phoneMobile) lines.push(v4 ? `TEL;TYPE=cell,voice;VALUE=uri:tel:${escVCard(phoneMobile)}` : v2 ? `TEL;CELL;VOICE:${escVCard(phoneMobile)}` : `TEL;TYPE=CELL,VOICE:${escVCard(phoneMobile)}`);
  if (email) lines.push(v4 ? `EMAIL;TYPE=work:${escVCard(email)}` : v2 ? `EMAIL;INTERNET:${escVCard(email)}` : `EMAIL:${escVCard(email)}`);
  if (website) lines.push(v4 ? `URL;TYPE=work:${escVCard(website)}` : `URL:${escVCard(website)}`);
  const addrParts = [street, city, state, zipcode, country].map(escVCard);
  if (addrParts.some(Boolean)) {
    const a = addrParts.join(";");
    lines.push(v4 ? `ADR;TYPE=work:;;${a}` : v2 ? `ADR;WORK:;;${a}` : `ADR;TYPE=WORK:;;${a}`);
  }
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function encodeLocation({ latitude, longitude }) {
  if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) return "";
  return `geo:${latitude},${longitude}`;
}

export function encodeEvent({ title = "", location = "", startTime = "", endTime = "" }) {
  const lines = ["BEGIN:VEVENT"];
  if (title) lines.push(`SUMMARY:${escICal(title)}`);
  if (location) lines.push(`LOCATION:${escICal(location)}`);
  const dtStart = startTime ? toICalDT(startTime) : "";
  const dtEnd = endTime ? toICalDT(endTime) : "";
  if (dtStart) lines.push(`DTSTART:${dtStart}`);
  if (dtEnd) lines.push(`DTEND:${dtEnd}`);
  lines.push(`DTSTAMP:${toICalDT(new Date())}`);
  lines.push("END:VEVENT");
  return `BEGIN:VCALENDAR\nVERSION:2.0\n${lines.join("\n")}\nEND:VCALENDAR`;
}

// ── Master encode ──────────────────────────────────────────────────────────

const ENCODERS = {
  text: encodeText,
  url: encodeUrl,
  email: encodeEmail,
  phone: encodePhone,
  sms: encodeSms,
  wifi: encodeWifi,
  vcard: encodeVCard,
  location: encodeLocation,
  event: encodeEvent,
};

export function encodeQRData(type, data) {
  return ENCODERS[type]?.(data) ?? data.text ?? "";
}

// ── Detector (used by scanner result display) ──────────────────────────────

export function detectDataType(raw) {
  if (!raw) return { type: "text", data: { text: raw } };
  if (/^BEGIN:VCARD/i.test(raw)) {
    const lines = raw.replace(/\r/g, "").split("\n");
    const d = {};
    const ver = lines.find((l) => /^VERSION:/i.test(l));
    d.version = ver ? (ver.includes("2.1") ? "2" : ver.includes("4.0") ? "4" : "3") : "3";
    const n = lines.find((l) => /^N:/i.test(l));
    if (n) {
      const p = n.slice(2).split(";");
      d.lastName = p[0] || "";
      d.firstName = p[1] || "";
    }
    const fn = lines.find((l) => /^FN:/i.test(l));
    if (fn && !d.firstName && !d.lastName) {
      const p = fn.slice(3).trim().split(" ");
      d.firstName = p[0] || "";
      d.lastName = p.slice(1).join(" ") || "";
    }
    const org = lines.find((l) => /^ORG:/i.test(l));
    if (org) d.org = org.slice(4).trim();
    const ttl = lines.find((l) => /^TITLE:/i.test(l));
    if (ttl) d.position = ttl.slice(6).trim();
    for (const l of lines) {
      if (/^TEL[^:]*(?:TYPE=WORK|WORK)[^:]*:/i.test(l))
        d.phoneWork = l
          .slice(l.indexOf(":") + 1)
          .replace(/^tel:/i, "")
          .trim();
      else if (/^TEL[^:]*(?:TYPE=HOME|HOME)[^:]*:/i.test(l))
        d.phonePrivate = l
          .slice(l.indexOf(":") + 1)
          .replace(/^tel:/i, "")
          .trim();
      else if (/^TEL[^:]*(?:TYPE=CELL|CELL|MOBILE)[^:]*:/i.test(l))
        d.phoneMobile = l
          .slice(l.indexOf(":") + 1)
          .replace(/^tel:/i, "")
          .trim();
      else if (/^TEL[^:]*:/i.test(l) && !d.phoneWork && !d.phonePrivate && !d.phoneMobile)
        d.phoneMobile = l
          .slice(l.indexOf(":") + 1)
          .replace(/^tel:/i, "")
          .trim();
    }
    const em = lines.find((l) => /^EMAIL[^:]*:/i.test(l));
    if (em) d.email = em.slice(em.indexOf(":") + 1).trim();
    const url = lines.find((l) => /^URL[^:]*:/i.test(l));
    if (url) d.website = url.slice(url.indexOf(":") + 1).trim();
    const adr = lines.find((l) => /^ADR[^:]*:/i.test(l));
    if (adr) {
      const p = adr.slice(adr.indexOf(":") + 1).split(";");
      if (p.length >= 7) {
        d.street = p[2];
        d.city = p[3];
        d.state = p[4];
        d.zipcode = p[5];
        d.country = p[6];
      }
    }
    return { type: "vcard", data: d };
  }
  if (/^https?:\/\//i.test(raw)) return { type: "url", data: { url: raw } };
  if (/^mailto:/i.test(raw)) {
    const [addr, qs] = raw.replace(/^mailto:/i, "").split("?");
    const d = { address: addr || "" };
    if (qs) {
      const p = new URLSearchParams(qs);
      d.subject = p.get("subject") || "";
      d.body = p.get("body") || "";
      d.cc = p.get("cc") || "";
      d.bcc = p.get("bcc") || "";
    }
    return { type: "email", data: d };
  }
  if (/^tel:/i.test(raw)) return { type: "phone", data: { phone: raw.replace(/^tel:/i, "") } };
  if (/^SMSTO:/i.test(raw)) {
    const p = raw.replace(/^SMSTO:/i, "").split(":");
    return { type: "sms", data: { phone: p[0] || "", message: p[1] || "" } };
  }
  if (/^WIFI:/i.test(raw)) {
    const d = {};
    const s = raw.match(/S:([^;]*);/i);
    if (s) d.ssid = s[1];
    const t = raw.match(/T:([^;]*);/i);
    if (t) d.encryption = t[1].toUpperCase() === "NOPASS" ? "nopass" : t[1].toUpperCase() === "WEP" ? "WEP" : "WPA";
    const p = raw.match(/P:([^;]*);/i);
    if (p) d.password = p[1];
    const h = raw.match(/H:(true|false);/i);
    d.hidden = h ? h[1] === "true" : false;
    return { type: "wifi", data: d };
  }
  if (/^geo:/i.test(raw)) {
    const [lat, lon] = raw.replace(/^geo:/i, "").split(",");
    return { type: "location", data: { latitude: lat || "", longitude: lon || "" } };
  }
  if (/BEGIN:VCALENDAR|BEGIN:VEVENT/i.test(raw)) {
    const d = {};
    const s = raw.match(/SUMMARY:([^\n\r]*)/i);
    if (s) d.title = s[1];
    const l = raw.match(/LOCATION:([^\n\r]*)/i);
    if (l) d.location = l[1];
    const ds = raw.match(/DTSTART(?:[^:]*):([^\n\r]*)/i);
    if (ds) d.startTime = fromICalDT(ds[1]);
    const de = raw.match(/DTEND(?:[^:]*):([^\n\r]*)/i);
    if (de) d.endTime = fromICalDT(de[1]);
    return { type: "event", data: d };
  }
  return { type: "text", data: { text: raw } };
}
