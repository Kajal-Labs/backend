import { z } from 'zod';

export const sessionIdSchema = z
    .object({
        sessionId: z.string().uuid(),
    })
    .strict();

export type SessionIdParams = z.infer<typeof sessionIdSchema>;
