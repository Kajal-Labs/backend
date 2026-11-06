export const OTP_PURPOSES = ['login', 'verify-email', 'reset-password'] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const OTP_LENGTH = 6;
export const OTP_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;

/** Code lifetime per purpose, in seconds. */
export const TTL_SECONDS: Record<OtpPurpose, number> = {
    login: 5 * 60,
    'verify-email': 10 * 60,
    'reset-password': 10 * 60,
};
