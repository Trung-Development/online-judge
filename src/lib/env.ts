import { z, ZodError } from "zod";

const envSchema = z.object({
  API_ENDPOINT: z.url("API_ENDPOINT must be a valid URL"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required"),
  STORAGE_ENDPOINT: z.string(),
  STORAGE_ACCESS_KEY_ID: z.string(),
  STORAGE_SECRET_ACCESS_KEY: z.string(),
  STORAGE_BUCKET: z.string(),
  STORAGE_REGION: z.string().optional(),
  SESSION_ENC_KEY: z.string().optional(),
});

// Parse environment variables with helpful error messages
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse({
    API_ENDPOINT:
      process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || "",
    STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID || "",
    STORAGE_SECRET_ACCESS_KEY: process.env.STORAGE_SECRET_ACCESS_KEY || "",
    STORAGE_BUCKET: process.env.STORAGE_BUCKET || "",
    STORAGE_REGION: process.env.STORAGE_REGION || "auto",
    SESSION_ENC_KEY: process.env.SESSION_ENC_KEY || undefined,
  });
} catch (error) {
  if (error instanceof ZodError) {
    const errorMessages = error.issues.map(
      (err) => `${err.path.join(".")}: ${err.message}`
    );
    throw new Error(
      `Environment validation failed:\n${errorMessages.join("\n")}`
    );
  }
  throw error;
}

export { env };
export type Environment = z.infer<typeof envSchema>;
