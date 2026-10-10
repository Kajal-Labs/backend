import { Body, Controller, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { registerSchema, type RegisterInput } from './registration.schema.js';
import { RegistrationService } from './registration.service.js';

@Controller('auth/register')
export class RegistrationController {
    constructor(private readonly registrationService: RegistrationService) {}

    @Post()
    register(
        @Body(new ZodValidationPipe(registerSchema))
        body: RegisterInput,
    ) {
        // Receive and validate registration data.
        // Delegate registration logic to RegistrationService.
        // Do not access the database from the controller.

        return this.registrationService.register(body);
    }
}
