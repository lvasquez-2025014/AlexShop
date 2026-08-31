/**
 * Logger simple para eventos de seguridad.
 * En producción, estos logs deberían enviarse a un servicio
 * centralizado (Datadog, Sentry, Logtail, etc.).
 */
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

type Level = "info" | "warn" | "error" | "success";

function format(level: Level, tag: string, msg: string, meta?: unknown) {
  const colors = { info: CYAN, warn: YELLOW, error: RED, success: GREEN };
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  // eslint-disable-next-line no-console
  console.log(
    `${colors[level]}[${ts}] [${level.toUpperCase()}] [${tag}]${RESET} ${msg}${metaStr}`
  );
}

export const securityLog = {
  loginSuccess: (email: string, ip: string) =>
    format("success", "AUTH", "Login exitoso", { email, ip }),
  loginFailed: (email: string, ip: string, reason: string) =>
    format("warn", "AUTH", "Login fallido", { email, ip, reason }),
  logout: (userId: string, ip: string) =>
    format("info", "AUTH", "Logout", { userId, ip }),
  tokenRefresh: (userId: string, ip: string) =>
    format("info", "AUTH", "Token refrescado", { userId, ip }),
  rateLimitHit: (ip: string, path: string) =>
    format("warn", "RATE", "Rate limit alcanzado", { ip, path }),
  corsBlock: (origin: string, ip: string) =>
    format("warn", "CORS", "Origen bloqueado", { origin, ip }),
  fingerprintMismatch: (userId: string, ip: string) =>
    format("warn", "SEC", "Fingerprint mismatch", { userId, ip }),
  sessionRevoked: (userId: string, jti: string) =>
    format("warn", "SEC", "Sesión revocada", { userId, jti }),
  invalidToken: (ip: string) =>
    format("warn", "SEC", "Token inválido presentado", { ip }),
};