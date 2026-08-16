import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
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

  await db.update(users).set(updates).where(eq(users.id, authed!.sub));

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, authed!.sub))
    .limit(1);

  const u = result[0]!;
  res.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      picture: u.picture ?? "",
      role: u.role,
      ffName: u.ffName ?? "",
      ffId: u.ffId ?? "",
    },
  });
});

export default router;
