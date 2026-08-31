/**
 * Sistema de tokens JWT con acceso (2h) y refresh (7d),
 * con fingerprint del cliente para reducir el riesgo de robo de tokens.
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  role: "admin" | "client";
  /** Hash del fingerprint (IP + User-Agent) para validar el origen. */
  fp: string;
  /** Tipo de token. */
  typ: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  /** ID único de la sesión para poder revocarla. */
  jti: string;
  fp: string;
  typ: "refresh";
}

/** Genera un fingerprint hasheado a partir de IP + User-Agent. */
export function generateFingerprint(ip: string, userAgent: string): string {
  return crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}`)
    .digest("hex");
}

/** Compara dos strings en tiempo constante (evita timing attacks). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Firma un access token (corta duración, 2h). */
export function signAccessToken(payload: Omit<AccessTokenPayload, "typ">): string {
  return jwt.sign({ ...payload, typ: "access" }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: "alexshop",
    audience: "alexshop-api",
    algorithm: "HS256",
  });
}

/** Firma un refresh token (larga duración, 7d). */
export function signRefreshToken(payload: Omit<RefreshTokenPayload, "typ">): string {
  return jwt.sign({ ...payload, typ: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: "alexshop",
    audience: "alexshop-refresh",
    algorithm: "HS256",
  });
}

/** Genera un ID único para sesiones (jti). */
export function generateJti(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "alexshop",
      audience: "alexshop-api",
      algorithms: ["HS256"],
    }) as AccessTokenPayload;
    if (decoded.typ !== "access") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: "alexshop",
      audience: "alexshop-refresh",
      algorithms: ["HS256"],
    }) as RefreshTokenPayload;
    if (decoded.typ !== "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Devuelve el tiempo de expiración del access token en segundos. */
export function getAccessTokenExpiresIn(): number {
  return env.JWT_ACCESS_EXPIRES_IN;
}