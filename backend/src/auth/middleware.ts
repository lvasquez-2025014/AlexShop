import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "./token.js";

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Token invalido o expirado" });
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