import jwt from "jsonwebtoken";

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  role: "admin" | "client";
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export function signToken(payload: TokenPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET no configurado");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}