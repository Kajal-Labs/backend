import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../config/env/env.schema.js';
import type { OtpPurpose } from './otp.constants.js';

/**
 * Boundary for transactional email delivery. Replace the development branch
 * with the chosen provider integration before enabling OTP login in production.
 */
@Injectable()
export class OtpEmailService {
    constructor(private readonly config: ConfigService<Env, true>) {}

    sendOtp(email: string, otp: string, purpose: OtpPurpose): Promise<void> {
        const environment = this.config.get('NODE_ENV', { infer: true });

        if (environment === 'production' || environment === 'preview') {
            // TODO: Send this code through the configured transactional-email provider.
            return Promise.reject(
                new ServiceUnavailableException('OTP email delivery is not configured'),
            );
        }

        if (environment === 'development') {
            // TODO: Deliver through a local mail sink. OTP values must never be logged.
            void email;
            void otp;
            void purpose;
        }

        return Promise.resolve();
    }
}
