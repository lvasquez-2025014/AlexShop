import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
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

    const user = {
      sub: payload.sub ?? "",
      email: payload.email,
      name: payload.name ?? "",
      picture: payload.picture ?? "",
      role: "client" as const,
    };

    res.json({ token: signToken(user), user });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Token verification failed" });
  }
});

router.post("/login", (req, res) => {
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

  const user = {
    sub: "admin",
    email: adminEmail,
    name: "Administrador",
    picture: "",
    role: "admin" as const,
  };

  res.json({ token: signToken(user), user });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: (req as AuthedRequest).user });
});

export default router;