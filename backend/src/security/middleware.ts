/**
 * Middleware de autenticación y fingerprint.
 * - Valida JWT en cada request protegido.
 * - Verifica que el fingerprint (IP + UA) coincida con el del token.
 * - Rechaza tokens revocados.
 */
import type { Request, Response, NextFunction } from "express";
import {
  verifyAccessToken,
  generateFingerprint,
  type AccessTokenPayload,
} from "./token.js";
import { RevokedToken } from "../db/revoked-token.model.js";

export interface AuthedRequest extends Request {
  user?: AccessTokenPayload;
}

export function getClientIp(req: Request): string {
  // Render y otros proxies ponen la IP real en x-forwarded-for.
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]?.trim() ?? "unknown";
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export function getUserAgent(req: Request): string {
  return req.headers["user-agent"] ?? "unknown";
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const token = header.slice(7).trim();
  if (!token || token.length > 4096) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Token inválido o expirado" });
    return;
  }

  // Verificar fingerprint: si la IP o el navegador cambiaron, rechazar.
  const currentFp = generateFingerprint(getClientIp(req), getUserAgent(req));
  if (payload.fp !== currentFp) {
    res.status(401).json({
      error: "Sesión inválida para este dispositivo. Vuelve a iniciar sesión.",
    });
    return;
  }

  // Verificar blacklist (tokens revocados).
  const revoked = await RevokedToken.exists({ jti: payload.sub + ":" + payload.email });
  if (revoked) {
    res.status(401).json({ error: "Sesión revocada" });
    return;
  }

  (req as AuthedRequest).user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthedRequest).user;
  if (user?.role !== "admin") {
    res.status(403).json({ error: "Acceso denegado: solo admins" });
    return;
  }
  next();
}