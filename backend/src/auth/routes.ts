import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { User } from "../db/user.model.js";
import { signToken } from "./token.js";
import { requireAuth, type AuthedRequest } from "./middleware.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    let user = await User.findOne({ googleId });
    if (user) {
      user.name = name;
      user.picture = picture;
      await user.save();
    } else {
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        role: "client",
      });
    }

    const tokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture ?? "",
      role: user.role as "admin" | "client",
    };

    res.json({
      token: signToken(tokenPayload),
      user: toClient(user),
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

  const lowerEmail = adminEmail.toLowerCase();
  let user = await User.findOne({ email: lowerEmail });

  if (!user) {
    user = await User.create({
      email: lowerEmail,
      name: "Administrador",
      role: "admin",
    });
  } else if (user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  const tokenPayload = {
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    picture: user.picture ?? "",
    role: user.role as "admin" | "client",
  };

  res.json({
    token: signToken(tokenPayload),
    user: toClient(user),
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user;
  const user = await User.findById(authed!.sub);

  if (!user) {
    res.json({ user: authed });
    return;
  }

  res.json({ user: toClient(user) });
});

export default router;
