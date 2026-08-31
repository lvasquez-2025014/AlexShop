/**
 * Validadores con Zod para inputs de la API.
 * Rechaza datos malformados antes de llegar a la lógica de negocio.
 */
import { z } from "zod";

export const GoogleAuthSchema = z.object({
  credential: z
    .string()
    .min(50, "Credential inválido")
    .max(4096, "Credential demasiado largo"),
});

export const LoginSchema = z.object({
  email: z.string().email("Email inválido").max(254).toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

export const ProfileUpdateSchema = z.object({
  ffName: z.string().trim().max(50).optional(),
  ffId: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9]*$/, "FF ID solo puede contener números")
    .optional(),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(20).max(4096),
});