import { z } from 'zod';

const secret = (name: string) => z.string().min(32, `${name} must be at least 32 characters`);

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production', 'preview']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info'),

    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

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
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

    JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

    JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    SESSION_TTL_SECONDS: z.coerce.number().int().positive(),

    UPSTASH_REDIS_REST_URL: z
        .url()
        .refine((value) => value.startsWith('https://'), 'Upstash Redis URL must use HTTPS'),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),

    OTP_HASH_SECRET: secret('OTP_HASH_SECRET'),
});

export type Env = z.infer<typeof envSchema>;
