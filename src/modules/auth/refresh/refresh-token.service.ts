import { createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '../jwt/jwt.service.js';
import { PrismaService } from '../../../database/prisma/prisma.service.js';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const invalidToken = (): UnauthorizedException =>
    new UnauthorizedException('Invalid or expired refresh token');

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async createForSession(
        userId: string,
        sessionId: string,
    ): Promise<{ token: string; expiresAt: Date }> {
        const refresh = await this.jwtService.generateRefreshToken({
            sub: userId,
            sid: sessionId,
        });

        await this.prisma.refreshToken.create({
            data: {
                sessionId,
                tokenHash: hashToken(refresh.token),
                expiresAt: refresh.expiresAt,
            },
        });

        return refresh;
    }

    async refresh(rawToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshExpiresAt: Date;
    }> {
        const payload = await this.jwtService.verifyRefreshToken(rawToken);
        const tokenHash = hashToken(rawToken);
        const now = new Date();

        const existing = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                session: {
                    include: { user: true },
                },
            },
        });

        if (
            !existing ||
            existing.revokedAt !== null ||
            existing.expiresAt <= now ||
            existing.sessionId !== payload.sid ||
            existing.session.userId !== payload.sub ||
            !existing.session.isActive ||
            existing.session.revokedAt !== null ||
            existing.session.expiresAt <= now ||
            existing.session.user.status !== 'ACTIVE'
        ) {
            throw invalidToken();
        }

        const replacement = await this.jwtService.generateRefreshToken({
            sub: payload.sub,
            sid: payload.sid,
        });

        const accessToken = await this.jwtService.generateAccessToken({
            sub: payload.sub,
            sid: payload.sid,
        });

        await this.prisma.$transaction(async (tx) => {
            // Claim the old token exactly once to prevent concurrent reuse.
            const revoked = await tx.refreshToken.updateMany({
                where: {
                    id: existing.id,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                data: { revokedAt: now },
            });

            if (revoked.count !== 1) {
                throw invalidToken();
            }

            const session = await tx.session.updateMany({
                where: {
                    id: payload.sid,
                    userId: payload.sub,
                    isActive: true,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                data: { lastActiveAt: now },
            });

            if (session.count !== 1) {
                throw invalidToken();
            }

            const user = await tx.user.findFirst({
                where: {
                    id: payload.sub,
                    status: 'ACTIVE',
                },
                select: { id: true },
            });

            if (!user) {
                throw invalidToken();
            }

            await tx.refreshToken.create({
                data: {
                    sessionId: payload.sid,
                    tokenHash: hashToken(replacement.token),
                    expiresAt: replacement.expiresAt,
                },
            });
        });

        return {
            accessToken,
            refreshToken: replacement.token,
            refreshExpiresAt: replacement.expiresAt,
        };
    }
}
