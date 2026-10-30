import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
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
    private readonly refreshSecret: string;
    private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];

    constructor(
        private readonly jwt: NestJwtService,
        config: ConfigService,
    ) {
        this.secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
        this.expiresIn = config.getOrThrow<string>(
            'JWT_ACCESS_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'];

        this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
        this.refreshExpiresIn = config.getOrThrow<string>(
            'JWT_REFRESH_EXPIRES_IN',
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

    async generateRefreshToken(
        payload: AccessTokenPayload,
    ): Promise<{ token: string; expiresAt: Date }> {
        const token = await this.jwt.signAsync(payload, {
            secret: this.refreshSecret,
            expiresIn: this.refreshExpiresIn,
            issuer: ISSUER,
            audience: AUDIENCE,
            algorithm: ALGORITHM,
        });

        const decoded: unknown = this.jwt.decode(token);

        if (
            typeof decoded !== 'object' ||
            decoded === null ||
            !('exp' in decoded) ||
            typeof decoded.exp !== 'number'
        ) {
            throw new InternalServerErrorException('Unable to determine refresh-token expiration');
        }

        return {
            token,
            expiresAt: new Date(decoded.exp * 1000),
        };
    }

    async verifyRefreshToken(token: string): Promise<AccessTokenPayload> {
        try {
            const decoded = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
                secret: this.refreshSecret,
                issuer: ISSUER,
                audience: AUDIENCE,
                algorithms: [ALGORITHM],
            });

            return accessTokenPayloadSchema.parse(decoded);
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
}
