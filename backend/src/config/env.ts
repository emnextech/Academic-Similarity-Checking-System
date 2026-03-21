import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CLIENT_URL: z.string().url(),
  UPLOAD_DIR: z.string().min(1),
  ENABLE_EXTERNAL_SCAN: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  ENABLE_INTERNAL_SIMILARITY: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  OPENALEX_API_KEY: z.string().optional(),
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),
  EXTERNAL_SCAN_TIMEOUT_MS: z.coerce.number().int().positive().default(12000)
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  UPLOAD_DIR: path.resolve(process.cwd(), parsed.data.UPLOAD_DIR)
};
