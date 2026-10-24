import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { JwtService } from '../jwt/jwt.service.js';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing access token');
        }

        const token = authHeader.slice(7).trim();

        if (!token) {
            throw new UnauthorizedException('Missing access token');
        }

        const payload = await this.jwtService.verifyAccessToken(token);

        request.user = {
            id: payload.sub,
        };

        return true;
    }
}
