import { z, ZodError } from "zod";
import "dotenv/config";

const envSchema = z.object({
  API_ENDPOINT: z.url("API_ENDPOINT must be a valid URL"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required"),
});

// Parse environment variables with helpful error messages
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse({
    API_ENDPOINT: process.env.API_ENDPOINT,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
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
