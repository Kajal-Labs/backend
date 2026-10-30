import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '../jwt/jwt.service.js';
import type { LoginInput } from './login.schema.js';
import { Argon2Service } from '../password/argon2.service.js';
import { SessionService } from '../sessions/sessions.service.js';
import { RefreshTokenService } from '../refresh/refresh-token.service.js';
import { PrismaService } from '../../../database/prisma/prisma.service.js';
import type { RequestMetadata } from '../sessions/session-metadata.util.js';

@Injectable()
export class LoginService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordHasher: Argon2Service,
        private readonly jwtService: JwtService,
        private readonly sessionService: SessionService,
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    async login(data: LoginInput, metadata: RequestMetadata) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
            select: { id: true, passwordHash: true, status: true },
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
