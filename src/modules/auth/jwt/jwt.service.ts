import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

import type { JwtPayload } from './jwt-payload.interface.js';

@Injectable()
export class JwtService {
    constructor(private readonly jwt: NestJwtService) {}

    generateAccessToken(payload: JwtPayload): Promise<string> {
        return this.jwt.signAsync(payload);
    }

    async verifyAccessToken(token: string): Promise<JwtPayload> {
        try {
            const payload = await this.jwt.verifyAsync<JwtPayload>(token);

            if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
                throw new UnauthorizedException('Invalid access token');
            }

            return {
                sub: payload.sub,
            };
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }
}
