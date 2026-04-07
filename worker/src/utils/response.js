import { CORS_HEADERS } from "../config/constants.js";

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "text/html;charset=UTF-8" },
  });
}
