import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '../jwt/jwt.service.js';
import type { LoginInput } from './login.schema.js';
import type { LoginOtpInput } from './login-otp.schema.js';
import { Argon2Service } from '../password/argon2.service.js';
import { SessionService } from '../sessions/sessions.service.js';

import { RefreshTokenService } from '../refresh/refresh-token.service.js';
import { PrismaService } from '../../../infra/database/prisma/prisma.service.js';
import type { RequestMetadata } from '../sessions/session-metadata.util.js';

import { OtpService } from '../otp/otp.service.js';
import { OtpEmailService } from '../otp/otp-email.service.js';
import { OtpRateLimiterService } from '../otp/otp-rate-limiter.service.js';

@Injectable()
export class LoginService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordHasher: Argon2Service,
        private readonly jwtService: JwtService,
        private readonly sessionService: SessionService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly otpService: OtpService,
        private readonly otpEmailService: OtpEmailService,
        private readonly otpRateLimiter: OtpRateLimiterService,
    ) {}

    async beginLogin(data: LoginInput, ipAddress: string | null) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
            select: { id: true, email: true, passwordHash: true, status: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await this.passwordHasher.verify(data.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.otpRateLimiter.assertRequestAllowed(user.id, ipAddress, 'login');

        const otp = await this.otpService.issue('login', user.email);

        try {
            await this.otpEmailService.sendOtp(user.email, otp, 'login');
        } catch (error) {
            await this.otpService.invalidate('login', user.email).catch(() => undefined);
            throw error;
        }

        return {
            data: { requiresOtp: true },
            message: 'A verification code has been sent to your email address.',
        };
    }

    async completeLogin(data: LoginOtpInput, metadata: RequestMetadata) {
        await this.otpRateLimiter.assertVerificationAllowed(metadata.ipAddress);

        const isOtpValid = await this.otpService.verify('login', data.email, data.otp);

        if (!isOtpValid) {
            throw new UnauthorizedException('Invalid or expired verification code');
        }

        const user = await this.prisma.user.findFirst({
            where: { email: data.email, status: 'ACTIVE' },
            select: { id: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired verification code');
        }

        const session = await this.sessionService.createSession(user.id, metadata);

        const accessToken = await this.jwtService.generateAccessToken({
            sub: user.id,
            sid: session.id,
        });

        const refresh = await this.refreshTokenService.createForSession(user.id, session.id);

        return {
            data: {
                accessToken,
                tokenType: 'Bearer',
            },
            message: 'Successfully logged in.',
            refreshToken: refresh.token,
            refreshExpiresAt: refresh.expiresAt,
        };
    }
}
