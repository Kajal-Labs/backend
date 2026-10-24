import { Body, Controller, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { loginSchema, type LoginInput } from './login.schema.js';
import { LoginService } from './login.service.js';

@Controller('auth/login')
export class LoginController {
    constructor(private readonly loginService: LoginService) {}

    @Post()
    login(
        @Body(new ZodValidationPipe(loginSchema))
        body: LoginInput,
    ) {
        return this.loginService.login(body);
    }
}
