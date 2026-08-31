/**
 * Modelo de sesiones activas.
 * Cada vez que un usuario inicia sesión se crea una sesión.
 * Permite al usuario ver y revocar sesiones específicas.
 */
import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    refreshJti: { type: String, required: true, unique: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    fingerprint: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

// TTL: eliminar sesiones expiradas automáticamente.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Limpia el TTL del refresh en `revokedTokens` (por si se reusa jti).
sessionSchema.index({ userId: 1, createdAt: -1 });

export const Session = model("Session", sessionSchema);