import { z } from 'zod';

export const loginSchema = z
    .object({
        email: z
            .string()
            .trim()
            .min(1, 'Email is required')
            .max(254, 'Email is too long')
            .email('Enter a valid email address')
            .transform((email) => email.toLowerCase()),

        password: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? 'Password is required'
                        : 'Password must be a string',
            })
            .min(1, 'Password is required'),
    })
    .strict();

export type LoginInput = z.infer<typeof loginSchema>;
