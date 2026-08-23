import { z } from 'zod';

import { envSchema } from './env.schema.js';

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
    const result = envSchema.safeParse(config);

    if (!result.success) {
        const message = z.prettifyError(result.error);

        throw new Error(`Environment validation failed:\n${message}`);
    }

    return result.data;
}
