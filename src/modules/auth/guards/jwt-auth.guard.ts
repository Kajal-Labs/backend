import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { JwtService } from '../jwt/jwt.service.js';
import type { AuthenticatedRequest } from './authenticated-request.interface.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        const match = request.headers.authorization?.match(/^Bearer\s+(\S+)$/i);

        if (!match) {
            throw new UnauthorizedException('Missing access token');
        }

        const payload = await this.jwtService.verifyAccessToken(match[1]);

        const session = await this.prisma.session.findFirst({
            where: {
                id: payload.sid,
                userId: payload.sub,
                isActive: true,
                revokedAt: null,
                expiresAt: { gt: new Date() },
                user: {
                    status: 'ACTIVE',
                },
            },
            select: {
                id: true,
            },
        });

        if (!session) {
            throw new UnauthorizedException('Session is invalid, expired, or revoked');
        }

        request.user = {
            id: payload.sub,
            sessionId: session.id,
        };

        return true;
    }
}
