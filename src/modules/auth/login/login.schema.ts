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

        password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
    })
    .strict();

export type LoginInput = z.infer<typeof loginSchema>;
