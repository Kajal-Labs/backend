import { Body, Controller, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { registerSchema, type RegisterInput } from './registration.schema.js';
import { RegistrationService } from './registration.service.js';

@Controller('auth/register')
export class RegistrationController {
    constructor(private readonly registrationService: RegistrationService) {}

    @Post()
    async register(
        @Body(new ZodValidationPipe(registerSchema))
        body: RegisterInput,
    ) {
        // TODO:
        // 1. Receive and validate registration data.
        // 2. Pass validated data to RegistrationService.
        // 3. Return the service response.
        //
        // Do NOT add business logic here.
        // Do NOT access the database directly from the controller.

        return this.registrationService.register(body);
    }
}
