import { Module } from '@nestjs/common';

import { OtpService } from './otp.service.js';
import { Argon2Service } from '../password/argon2.service.js';
import { OtpEmailService } from './otp-email.service.js';
import { OtpRateLimiterService } from './otp-rate-limiter.service.js';
import { OtpWorkflowService } from './otp-workflow.service.js';
import { OtpController } from './otp.controller.js';

@Module({
    controllers: [OtpController],
    providers: [
        OtpService,
        OtpEmailService,
        OtpRateLimiterService,
        OtpWorkflowService,
        Argon2Service,
    ],
    exports: [OtpService, OtpEmailService, OtpRateLimiterService],
})
export class OtpModule {}
