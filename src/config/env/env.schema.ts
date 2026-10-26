import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production', 'preview']).default('development'),

    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    DATABASE_URL: z
        .string()
        .trim()
        .min(1, 'DATABASE_URL is required')
        .refine(
            (value) => {
                try {
                    const url = new URL(value);

                    return url.protocol === 'postgresql:' || url.protocol === 'postgres:';
                } catch {
                    return false;
                }
            },
            {
                message: 'DATABASE_URL must be a valid PostgreSQL connection URL',
            },
        ),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    SESSION_TTL_SECONDS: z.coerce.number().int().positive(),
});

export type Env = z.infer<typeof envSchema>;
