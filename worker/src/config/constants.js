export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const CODE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const CODE_LENGTH = 7;
export const MAX_CLICK_LOG = 500;
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_SEC = 60;
export const SESSION_TTL_SEC = 2592000; // 30 days
