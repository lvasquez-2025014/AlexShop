import { Router } from "express";
import { User } from "../db/user.model.js";
import { requireAuth, type AuthedRequest } from "../security/middleware.js";
import { ProfileUpdateSchema } from "../security/validation.js";

const router = Router();

router.patch("/profile", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user!;

  const parsed = ProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    return;
  }

  const updates: Record<string, string> = {};
  if (parsed.data.ffName !== undefined) updates.ffName = parsed.data.ffName;
  if (parsed.data.ffId !== undefined) updates.ffId = parsed.data.ffId;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Sin cambios" });
    return;
  }

  const user = await User.findByIdAndUpdate(
    authed.sub,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture ?? "",
      role: user.role,
      ffName: user.ffName ?? "",
      ffId: user.ffId ?? "",
    },
  });
});

export default router;
