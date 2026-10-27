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

        const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

        if (scheme?.toLowerCase() !== 'bearer' || !token) {
            throw new UnauthorizedException('Missing access token');
        }

        const payload = await this.jwtService.verifyAccessToken(token);

        // Access tokens are bound to a session, so revoking a session
        // invalidates its token immediately.
        const session = await this.prisma.session.findFirst({
            where: {
                id: payload.sid,
                userId: payload.sub,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            select: { id: true },
        });

        if (!session) {
            throw new UnauthorizedException('Session is invalid, expired, or revoked');
        }

        request.user = { id: payload.sub, sessionId: payload.sid };

        return true;
    }
}
