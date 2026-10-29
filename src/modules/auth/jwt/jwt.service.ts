import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService, type JwtSignOptions } from '@nestjs/jwt';

import { accessTokenPayloadSchema, type AccessTokenPayload } from './jwt-payload.interface.js';

const ISSUER = 'kajal-api';
const AUDIENCE = 'kajal-client';
const ALGORITHM = 'HS256';

@Injectable()
export class JwtService {
    private readonly secret: string;
    private readonly expiresIn: JwtSignOptions['expiresIn'];

    constructor(
        private readonly jwt: NestJwtService,
        config: ConfigService,
    ) {
        // Read once so a missing env var fails at boot, not on the first login.
        this.secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
        this.expiresIn = config.getOrThrow<string>(
            'JWT_ACCESS_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'];
    }

    generateAccessToken(payload: AccessTokenPayload): Promise<string> {
        return this.jwt.signAsync(payload, {
            secret: this.secret,
            expiresIn: this.expiresIn,
            issuer: ISSUER,
            audience: AUDIENCE,
            algorithm: ALGORITHM,
        });
    }

    async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
        try {
            const decoded = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
                secret: this.secret,
                issuer: ISSUER,
                audience: AUDIENCE,
                algorithms: [ALGORITHM],
            });

            return accessTokenPayloadSchema.parse(decoded);
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }
}
