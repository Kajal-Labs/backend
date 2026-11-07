import { z } from 'zod';

import { OTP_LENGTH, OTP_PURPOSES } from './otp.constants.js';

const emailSchema = z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Enter a valid email address')
    .transform((email) => email.toLowerCase());

export const otpRequestSchema = z
    .object({
        purpose: z.enum(OTP_PURPOSES),
        email: emailSchema,
    })
    .strict();

export const otpVerifySchema = otpRequestSchema
    .extend({
        otp: z
            .string()
            .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `OTP must be ${OTP_LENGTH} digits`),
    })
    .strict();

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
