export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidAlias(alias) {
  if (!alias) return false;
  const codepoints = [...alias].length;
  if (codepoints < 2 || codepoints > 40) return false;
  return !/[\s/?#\x00-\x1f\\]/.test(alias);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
