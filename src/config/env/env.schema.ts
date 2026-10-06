import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

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
});

export type Env = z.infer<typeof envSchema>;
