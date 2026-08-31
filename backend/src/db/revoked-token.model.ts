/**
 * Modelo de tokens revocados (blacklist).
 * Se usa para logout seguro y para revocar sesiones comprometidas.
 * Las entradas expiran automáticamente cuando expira el token original (TTL index).
 */
import { Schema, model } from "mongoose";

const revokedTokenSchema = new Schema(
  {
    /** ID único del token (jti) o hash del token si no tiene jti. */
    jti: { type: String, required: true, unique: true, index: true },
    /** Usuario dueño del token. */
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Razón de la revocación (logout, security, admin_revoke). */
    reason: {
      type: String,
      enum: ["logout", "security", "admin_revoke", "password_change"],
      required: true,
    },
    /** Expiración del token (TTL: MongoDB borrará automáticamente). */
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

// Índice TTL: MongoDB eliminará automáticamente documentos cuando expiresAt pase.
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken = model("RevokedToken", revokedTokenSchema);