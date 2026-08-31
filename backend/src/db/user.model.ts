import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";

export type UserRole = "admin" | "client";

export const BCRYPT_ROUNDS = 12; // ~250ms, balance seguridad/UX.

const userSchema = new Schema(
  {
    googleId: { type: String, default: null, sparse: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    picture: { type: String, default: "" },
    role: {
      type: String,
      enum: ["admin", "client"],
      default: "client",
      required: true,
    },
    ffName: { type: String, default: "" },
    ffId: { type: String, default: "" },
    /** Password hasheado con bcrypt. `select: false` para no devolverlo nunca. */
    passwordHash: { type: String, default: null, select: false },
    /** Bloqueo de cuenta por fuerza bruta. */
    loginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true, versionKey: false }
);

/** Hook: hashear password si fue modificado. */
userSchema.pre("save", async function () {
  const doc = this as any;
  if (this.isModified("passwordHash") && doc.passwordHash) {
    doc.passwordHash = await bcrypt.hash(doc.passwordHash, BCRYPT_ROUNDS);
  }
});

/** Método para comparar passwords de forma timing-safe. */
userSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  const doc = this as any;
  if (!doc.passwordHash) return false;
  return bcrypt.compare(candidate, doc.passwordHash);
};

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = (ret._id as { toString(): string }).toString();
    delete ret._id;
    delete (ret as any).passwordHash;
    delete (ret as any).loginAttempts;
    delete (ret as any).lockedUntil;
    return ret;
  },
});

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model("User", userSchema);