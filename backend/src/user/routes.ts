import { Router } from "express";
import { User } from "../db/user.model.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";

const router = Router();

router.patch("/profile", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user;
  const { ffName, ffId } = req.body as { ffName?: string; ffId?: string };

  const updates: Record<string, string> = {};
  if (ffName !== undefined) updates.ffName = ffName;
  if (ffId !== undefined) updates.ffId = ffId;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Sin cambios" });
    return;
  }

  const user = await User.findByIdAndUpdate(
    authed!.sub,
    { $set: updates },
    { new: true }
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
