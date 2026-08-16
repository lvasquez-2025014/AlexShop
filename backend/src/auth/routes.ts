import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { signToken } from "./token.js";
import { requireAuth, type AuthedRequest } from "./middleware.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  const { credential } = req.body as { credential?: string };
  if (!credential || typeof credential !== "string") {
    res.status(400).json({ error: "Credencial requerida" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(401).json({ error: "Token invalido" });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name ?? "";
    const picture = payload.picture ?? "";

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);

    let user;
    if (existing.length > 0) {
      user = existing[0]!;
      await db
        .update(users)
        .set({ name, picture })
        .where(eq(users.id, user.id));
      user.name = name;
      user.picture = picture;
    } else {
      const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const inserted = await db
        .insert(users)
        .values({ id, googleId, email, name, picture, role: "client" })
        .returning();
      user = inserted[0]!;
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? "",
      role: user.role as "admin" | "client",
    };

    res.json({
      token: signToken(tokenPayload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture ?? "",
        role: user.role,
        ffName: user.ffName ?? "",
        ffId: user.ffId ?? "",
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Token verification failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email y contrasena requeridos" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    res.status(500).json({ error: "Admin no configurado en el servidor" });
    return;
  }

  const emailMatches = email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatches = password === adminPassword;
  if (!emailMatches || !passwordMatches) {
    res.status(401).json({ error: "Credenciales invalidas" });
    return;
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail.toLowerCase()))
    .limit(1);

  let user;
  if (existing.length > 0) {
    user = existing[0]!;
    if (user.role !== "admin") {
      await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
      user.role = "admin";
    }
  } else {
    const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inserted = await db
      .insert(users)
      .values({ id, email: adminEmail.toLowerCase(), name: "Administrador", role: "admin" })
      .returning();
    user = inserted[0]!;
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture ?? "",
    role: user.role as "admin" | "client",
  };

  res.json({
    token: signToken(tokenPayload),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? "",
      role: user.role,
      ffName: user.ffName ?? "",
      ffId: user.ffId ?? "",
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, authed!.sub))
    .limit(1);

  if (result.length === 0) {
    res.json({ user: authed });
    return;
  }

  const u = result[0]!;
  res.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      picture: u.picture ?? "",
      role: u.role,
      ffName: u.ffName ?? "",
      ffId: u.ffId ?? "",
    },
  });
});

export default router;
