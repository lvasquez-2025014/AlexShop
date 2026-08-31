import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

export type UserRole = "admin" | "client";

const userSchema = new Schema(
  {
    googleId: { type: String, default: null, sparse: true, unique: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:     { type: String, required: true, trim: true },
    picture:  { type: String, default: "" },
    role:     { type: String, enum: ["admin", "client"], default: "client", required: true },
    ffName:   { type: String, default: "" },
    ffId:     { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = (ret._id as { toString(): string }).toString();
    delete ret._id;
    return ret;
  },
});

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model("User", userSchema);