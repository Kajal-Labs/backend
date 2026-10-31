import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { LoginService } from './login.service.js';
import { loginSchema, type LoginInput } from './login.schema.js';
import { REFRESH_COOKIE } from '../refresh/refresh.controller.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';

const MAX_USER_AGENT_LENGTH = 512;

@Controller('auth/login')
export class LoginController {
    constructor(private readonly loginService: LoginService) {}

    @Post()
    async login(
        @Body(new ZodValidationPipe(loginSchema))
        body: LoginInput,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.loginService.login(body, {
            ipAddress: request.ip ?? null,
            userAgent: request.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
        });

        response.cookie(REFRESH_COOKIE, result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/v1/auth',
            expires: result.refreshExpiresAt,
        });

        return {
            data: result.data,
            message: result.message,
        };
    }
}
