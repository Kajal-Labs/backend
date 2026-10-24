import { Module } from '@nestjs/common';

import { AuthJwtModule } from './jwt/jwt.module.js';
import { LoginService } from './login/login.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { Argon2Service } from './password/argon2.service.js';
import { LoginController } from './login/login.controller.js';
import { RegistrationService } from './registration/registration.service.js';
import { RegistrationController } from './registration/registration.controller.js';

@Module({
    imports: [AuthJwtModule],
    providers: [JwtAuthGuard, Argon2Service, LoginService, RegistrationService],
    exports: [Argon2Service],
    controllers: [LoginController, RegistrationController],
})
export class AuthModule {}
