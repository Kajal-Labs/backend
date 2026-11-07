import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../../infra/database/prisma/prisma.service.js';
import { OtpEmailService } from './otp-email.service.js';
import { OtpRateLimiterService } from './otp-rate-limiter.service.js';
import { OtpService } from './otp.service.js';
import type { OtpRequestInput, OtpVerifyInput } from './otp.schema.js';

const invalidOtp = (): UnauthorizedException =>
    new UnauthorizedException('Invalid or expired verification code');

@Injectable()
export class OtpWorkflowService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly otpService: OtpService,
        private readonly otpEmailService: OtpEmailService,
        private readonly otpRateLimiter: OtpRateLimiterService,
    ) {}

    async request(data: OtpRequestInput, ipAddress: string | null): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
            select: { id: true, email: true, status: true },
        });

        // Always enforce the IP limit. Keep the response identical when no account exists.
        const userLimited = await this.otpRateLimiter.isPublicRequestUserLimited(
            user?.status === 'ACTIVE' ? user.id : null,
            ipAddress,
            data.purpose,
        );

        if (!user || user.status !== 'ACTIVE' || userLimited) {
            return;
        }

        const otp = await this.otpService.issue(data.purpose, user.email);

        try {
            await this.otpEmailService.sendOtp(user.email, otp, data.purpose);
        } catch (error) {
            await this.otpService.invalidate(data.purpose, user.email).catch(() => undefined);
            throw error;
        }
    }

    async verify(data: OtpVerifyInput, ipAddress: string | null): Promise<void> {
        await this.otpRateLimiter.assertVerificationAllowed(ipAddress);

        const isValid = await this.otpService.verify(data.purpose, data.email, data.otp);

        if (!isValid) {
            throw invalidOtp();
        }

        if (data.purpose === 'verify-email') {
            await this.prisma.user.updateMany({
                where: { email: data.email, status: 'ACTIVE', emailVerifiedAt: null },
                data: { emailVerifiedAt: new Date() },
            });
        }
    }
}
