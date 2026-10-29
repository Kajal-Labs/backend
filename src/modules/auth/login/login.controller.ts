import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { loginSchema, type LoginInput } from './login.schema.js';
import { LoginService } from './login.service.js';

const MAX_USER_AGENT_LENGTH = 512;

@Controller('auth/login')
export class LoginController {
    constructor(private readonly loginService: LoginService) {}

    @Post()
    login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput, @Req() request: Request) {
        // request.ip is only the real client IP if `trust proxy` is set when behind a proxy/LB.
        return this.loginService.login(body, {
            ipAddress: request.ip ?? null,
            userAgent: request.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
        });
    }
}
