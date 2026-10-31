import {
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { RefreshTokenService } from './refresh-token.service.js';

export const REFRESH_COOKIE = 'refresh_token';

const COOKIE_PATH = '/api/v1/auth';

function readRefreshCookie(request: Request): string | undefined {
    const header = request.headers.cookie;

    if (!header) {
        return undefined;
    }

    for (const part of header.split(';')) {
        const separator = part.indexOf('=');

        if (separator < 0) {
            continue;
        }

        const name = part.slice(0, separator).trim();

        if (name === REFRESH_COOKIE) {
            const value = part.slice(separator + 1).trim();

            return value.length > 0 ? value : undefined;
        }
    }

    return undefined;
}

@Controller('auth/refresh')
export class RefreshController {
    constructor(private readonly refreshTokenService: RefreshTokenService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
        const refreshToken = readRefreshCookie(request);

        if (!refreshToken) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const result = await this.refreshTokenService.refresh(refreshToken);

        response.cookie(REFRESH_COOKIE, result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: COOKIE_PATH,
            expires: result.refreshExpiresAt,
        });

        return {
            data: {
                accessToken: result.accessToken,
                tokenType: 'Bearer',
            },
            message: 'Access token refreshed successfully.',
        };
    }
}
