import { Body, Controller, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { loginSchema, type LoginInput } from './login.schema.js';
import { LoginService } from './login.service.js';

@Controller('auth/login')
export class LoginController {
    constructor(private readonly loginService: LoginService) {}

    @Post()
    async login(
        @Body(new ZodValidationPipe(loginSchema))
        body: LoginInput,
    ) {
        // TODO:
        // 1. Receive and validate login credentials.
        // 2. Pass the validated data to LoginService.
        // 3. Return the service response.
        //
        // Do NOT add authentication/business logic here.
        // Do NOT access the database directly from the controller.

        return this.loginService.login(body);
    }
}
