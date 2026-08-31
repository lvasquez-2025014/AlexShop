import { Router } from "express";
import type { Request } from "express";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import { User, BCRYPT_ROUNDS } from "../db/user.model.js";
import { Session } from "../db/session.model.js";
import { RevokedToken } from "../db/revoked-token.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateFingerprint,
  generateJti,
  getAccessTokenExpiresIn,
} from "../security/token.js";
import {
  requireAuth,
  getClientIp,
  getUserAgent,
  type AuthedRequest,
} from "../security/middleware.js";
import {
  GoogleAuthSchema,
  LoginSchema,
  RefreshSchema,
} from "../security/validation.js";
import { securityLog } from "../security/logger.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min
const REFRESH_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function toClient(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  picture?: string;
  role: string;
  ffName?: string;
  ffId?: string;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    picture: user.picture ?? "",
    role: user.role,
    ffName: user.ffName ?? "",
    ffId: user.ffId ?? "",
  };
}

/**
 * Crea una sesión nueva en BD y firma access + refresh tokens.
 * Centraliza toda la lógica de creación de sesiones.
 */
async function createSession(
  userId: string,
  email: string,
  name: string,
  picture: string,
  role: "admin" | "client",
  req: Request
) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const fingerprint = generateFingerprint(ip, userAgent);
  const jti = generateJti();
  const refreshJti = generateJti();

  const accessToken = signAccessToken({
    sub: userId,
    email,
    name,
    picture,
    role,
    fp: fingerprint,
  });

  const refreshToken = signRefreshToken({
    sub: userId,
    jti: refreshJti,
    fp: fingerprint,
  });

  await Session.create({
    userId,
    jti,
    refreshJti,
    ip,
    userAgent,
    fingerprint,
    expiresAt: new Date(Date.now() + REFRESH_DURATION_MS),
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpiresIn(),
  };
}

/* ───────────────────────── Google OAuth ───────────────────────── */

router.post("/google", async (req, res) => {
  const parsed = GoogleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const { credential } = parsed.data;
  const ip = getClientIp(req);

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      securityLog.loginFailed("google-no-email", ip, "Email no verificado");
      res.status(401).json({ error: "Email no verificado por Google" });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = (payload.name ?? "").slice(0, 100);
    const picture = payload.picture ?? "";

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        role: "client",
      });
    } else {
      // Resetear intentos fallidos en login exitoso.
      user.loginAttempts = 0;
      user.lockedUntil = null;
      user.name = name;
      user.picture = picture;
      await user.save();
    }

    const { accessToken, refreshToken, expiresIn } = await createSession(
      user._id.toString(),
      user.email,
      user.name,
      user.picture ?? "",
      user.role as "admin" | "client",
      req
    );

    securityLog.loginSuccess(user.email, ip);

    res.json({
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: "Bearer",
      user: toClient(user),
    });
  } catch {
    securityLog.loginFailed("google", ip, "Token verification failed");
    res.status(401).json({ error: "Autenticación con Google fallida" });
  }
});

/* ───────────────────────── Admin Login ───────────────────────── */

router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const { email, password } = parsed.data;
  const ip = getClientIp(req);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  const user = await User.findOne({ email }).select(
    "+passwordHash +loginAttempts +lockedUntil"
  );

  // Verificar bloqueo de cuenta.
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    securityLog.loginFailed(email, ip, "Cuenta bloqueada");
    res.status(429).json({
      error: `Demasiados intentos. Cuenta bloqueada por ${minutesLeft} minutos.`,
    });
    return;
  }

  // Timing-safe: siempre comparar contra un hash dummy para igualar tiempos.
  const dummyHash = "$2b$12$" + "x".repeat(53);
  const hashToCompare = user?.passwordHash ?? dummyHash;
  const passwordOk = await bcrypt.compare(password, hashToCompare);

  const isAdminEmail = email === adminEmail;
  if (!isAdminEmail || !passwordOk) {
    if (user) {
      user.loginAttempts = (user.loginAttempts ?? 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.loginAttempts = 0;
        securityLog.loginFailed(email, ip, "Cuenta bloqueada por brute-force");
      } else {
        securityLog.loginFailed(email, ip, "Credenciales inválidas");
      }
      await user.save();
    } else {
      securityLog.loginFailed(email, ip, "Email no existe");
    }
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  // Login exitoso: resetear contadores.
  if (user) {
    user.loginAttempts = 0;
    user.lockedUntil = null;
    if (!user.passwordHash) {
      user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    user.role = "admin";
    await user.save();
  } else {
    await User.create({
      email,
      name: "Administrador",
      role: "admin",
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    });
  }

  const finalUser =
    user ??
    (await User.findOne({ email }).select(
      "+passwordHash +loginAttempts +lockedUntil"
    ));

  if (!finalUser) {
    res.status(500).json({ error: "Error inesperado" });
    return;
  }

  const { accessToken, refreshToken, expiresIn } = await createSession(
    finalUser._id.toString(),
    finalUser.email,
    finalUser.name,
    finalUser.picture ?? "",
    finalUser.role as "admin" | "client",
    req
  );

  securityLog.loginSuccess(finalUser.email, ip);

  res.json({
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: "Bearer",
    user: toClient(finalUser),
  });
});

/* ───────────────────────── Refresh Token ───────────────────────── */

router.post("/refresh", async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Refresh token requerido" });
    return;
  }

  const { refreshToken } = parsed.data;
  const ip = getClientIp(req);
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    securityLog.invalidToken(ip);
    res.status(401).json({ error: "Refresh token inválido o expirado" });
    return;
  }

  const session = await Session.findOne({ refreshJti: payload.jti });
  if (!session) {
    res.status(401).json({ error: "Sesión no encontrada" });
    return;
  }

  const currentFp = generateFingerprint(ip, getUserAgent(req));
  if (session.fingerprint !== currentFp) {
    securityLog.fingerprintMismatch(payload.sub, ip);
    res.status(401).json({ error: "Sesión inválida para este dispositivo" });
    return;
  }

  const revoked = await RevokedToken.exists({ jti: payload.jti });
  if (revoked) {
    res.status(401).json({ error: "Sesión revocada" });
    return;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    res.status(401).json({ error: "Usuario no encontrado" });
    return;
  }

  // Rotar refresh: revocar el viejo y emitir uno nuevo.
  await RevokedToken.create({
    jti: payload.jti,
    userId: user._id,
    reason: "security",
    expiresAt: new Date(Date.now() + REFRESH_DURATION_MS),
  });

  session.lastUsedAt = new Date();
  await session.save();

  const {
    accessToken,
    refreshToken: newRefresh,
    expiresIn,
  } = await createSession(
    user._id.toString(),
    user.email,
    user.name,
    user.picture ?? "",
    user.role as "admin" | "client",
    req
  );

  securityLog.tokenRefresh(user.email, ip);

  res.json({
    accessToken,
    refreshToken: newRefresh,
    expiresIn,
    tokenType: "Bearer",
  });
});

/* ───────────────────────── Me / Logout / Sessions ───────────────────────── */

router.get("/me", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user!;
  const user = await User.findById(authed.sub);
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  res.json({ user: toClient(user) });
});

router.post("/logout", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user!;
  const ip = getClientIp(req);

  const session = await Session.findOne({ userId: authed.sub });
  if (session) {
    await RevokedToken.create({
      jti: session.refreshJti,
      userId: authed.sub,
      reason: "logout",
      expiresAt: new Date(Date.now() + REFRESH_DURATION_MS),
    });
    await Session.deleteOne({ _id: session._id });
  }

  securityLog.logout(authed.sub, ip);
  res.json({ message: "Sesión cerrada correctamente" });
});

router.post("/logout-all", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user!;
  const ip = getClientIp(req);

  const sessions = await Session.find({ userId: authed.sub });
  await Promise.all(
    sessions.map((s) =>
      RevokedToken.create({
        jti: s.refreshJti,
        userId: authed.sub,
        reason: "security",
        expiresAt: new Date(Date.now() + REFRESH_DURATION_MS),
      })
    )
  );
  await Session.deleteMany({ userId: authed.sub });

  securityLog.sessionRevoked(authed.sub, "all");
  res.json({ message: "Todas las sesiones han sido cerradas" });
});

router.get("/sessions", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user!;
  const sessions = await Session.find({ userId: authed.sub })
    .sort({ lastUsedAt: -1 })
    .select("-fingerprint")
    .lean();

  res.json({
    sessions: sessions.map((s) => ({
      id: s._id,
      ip: s.ip,
      userAgent: s.userAgent,
      lastUsedAt: s.lastUsedAt,
      createdAt: (s as any).createdAt,
    })),
  });
});

router.delete("/sessions/:id", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user!;
  const session = await Session.findOne({
    _id: req.params.id,
    userId: authed.sub,
  });

  if (!session) {
    res.status(404).json({ error: "Sesión no encontrada" });
    return;
  }

  await RevokedToken.create({
    jti: session.refreshJti,
    userId: authed.sub,
    reason: "security",
    expiresAt: new Date(Date.now() + REFRESH_DURATION_MS),
  });
  await Session.deleteOne({ _id: session._id });

  securityLog.sessionRevoked(authed.sub, session.refreshJti);
  res.json({ message: "Sesión revocada" });
});

export default router;
