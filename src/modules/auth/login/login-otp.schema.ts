import { z } from 'zod';

import { OTP_LENGTH } from '../otp/otp.constants.js';

export const loginOtpSchema = z
    .object({
        email: z
            .string()
            .trim()
            .min(1, 'Email is required')
            .max(254, 'Email is too long')
            .email('Enter a valid email address')
            .transform((email) => email.toLowerCase()),
        otp: z
            .string()
            .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `OTP must be ${OTP_LENGTH} digits`),
    })
    .strict();

export type LoginOtpInput = z.infer<typeof loginOtpSchema>;
