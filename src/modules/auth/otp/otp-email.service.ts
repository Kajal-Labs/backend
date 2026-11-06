import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../config/env/env.schema.js';

/**
 * Boundary for transactional email delivery. Replace the development branch
 * with the chosen provider integration before enabling OTP login in production.
 */
@Injectable()
export class OtpEmailService {
    private readonly logger = new Logger(OtpEmailService.name);

    constructor(private readonly config: ConfigService<Env, true>) {}

    async sendLoginOtp(email: string, otp: string): Promise<void> {
        const environment = this.config.get('NODE_ENV', { infer: true });

        if (environment === 'production' || environment === 'preview') {
            // TODO: Send this code through the configured transactional-email provider.
            throw new ServiceUnavailableException('OTP email delivery is not configured');
        }

        if (environment === 'development') {
            // Local-only convenience; never log authentication codes outside development.
            this.logger.warn(`Development login OTP for ${email}: ${otp}`);
        }
    }
}
