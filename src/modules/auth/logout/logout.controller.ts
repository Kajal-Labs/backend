import { Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../guards/authenticated-request.interface.js';
import { REFRESH_COOKIE } from '../refresh/refresh.controller.js';
import { LogoutService } from './logout.service.js';

const COOKIE_PATH = '/api/v1/auth';

@Controller('auth/logout')
@UseGuards(JwtAuthGuard)
export class LogoutController {
    constructor(private readonly logoutService: LogoutService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() request: AuthenticatedRequest,
        @Res({ passthrough: true }) response: Response,
    ) {
        await this.logoutService.logout(request.user.id, request.user.sessionId);

        response.clearCookie(REFRESH_COOKIE, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: COOKIE_PATH,
        });

        return {
            data: null,
            message: 'Logged out successfully.',
        };
    }
}
