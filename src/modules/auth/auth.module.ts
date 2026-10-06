import { Module } from '@nestjs/common';

import { Argon2Service } from './password/argon2.service.js';

import { LoginService } from './login/login.service.js';
import { LoginController } from './login/login.controller.js';

import { RegistrationService } from './registration/registration.service.js';
import { RegistrationController } from './registration/registration.controller.js';

@Module({
    // TODO:
    // Add authentication-related providers/services here.
    providers: [Argon2Service, LoginService, RegistrationService],

    // TODO:
    // Export providers that need to be used by other modules.
    exports: [Argon2Service],

    // TODO:
    // Register authentication controllers here.
    controllers: [LoginController, RegistrationController],
})
export class AuthModule {}
