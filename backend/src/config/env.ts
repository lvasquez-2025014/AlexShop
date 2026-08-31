/**
 * Configuración centralizada y validada de variables de entorno.
 * Falla rápido al iniciar si falta algo crítico (fail-fast security).
 */
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  // MongoDB
  MONGODB_URI: z.string().min(1, "MONGODB_URI es requerido"),

  // JWT - claves con tamaño mínimo
  JWT_SECRET: z
    .string()
    .min(64, "JWT_SECRET debe tener al menos 64 caracteres (recomendado 128)")
    .refine((s) => /[a-z]/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s), {
      message: "JWT_SECRET debe contener mayúsculas, minúsculas y números",
    }),
  JWT_REFRESH_SECRET: z
    .string()
    .min(64, "JWT_REFRESH_SECRET debe tener al menos 64 caracteres")
    .refine((s) => /[a-z]/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s), {
      message: "JWT_REFRESH_SECRET debe contener mayúsculas, minúsculas y números",
    }),

  // Tiempos de expiración (en segundos)
  JWT_ACCESS_EXPIRES_IN: z.coerce.number().int().positive().default(7200), // 2 horas
  JWT_REFRESH_EXPIRES_IN: z.coerce.number().int().positive().default(604800), // 7 días

  // OAuth Google
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID es requerido"),

  // Admin
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL debe ser un email válido"),
  ADMIN_PASSWORD: z
    .string()
    .min(12, "ADMIN_PASSWORD debe tener al menos 12 caracteres"),

  // CORS
  CORS_ORIGINS: z.string().min(1, "CORS_ORIGINS es requerido"),

  // Rate limiting
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 min
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5), // 5 intentos
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const allowedOrigins = env.CORS_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);