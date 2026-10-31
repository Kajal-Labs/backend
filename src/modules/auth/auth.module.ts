import { Module } from '@nestjs/common';

import { AuthJwtModule } from './jwt/jwt.module.js';
import { LoginService } from './login/login.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { Argon2Service } from './password/argon2.service.js';
import { LoginController } from './login/login.controller.js';
import { RegistrationService } from './registration/registration.service.js';
import { RegistrationController } from './registration/registration.controller.js';
import { SessionsController } from './sessions/sessions.controller.js';
import { SessionService } from './sessions/sessions.service.js';

import { RefreshController } from './refresh/refresh.controller.js';
import { RefreshTokenService } from './refresh/refresh-token.service.js';

import { LogoutController } from './logout/logout.controller.js';
import { LogoutService } from './logout/logout.service.js';

@Module({
    imports: [AuthJwtModule],
    providers: [
        JwtAuthGuard,
        Argon2Service,
        SessionService,
        LoginService,
        RegistrationService,
        RefreshTokenService,
        LogoutService,
    ],
    exports: [Argon2Service],
    controllers: [
        SessionsController,
        LoginController,
        RegistrationController,
        RefreshController,
        LogoutController,
    ],
})
export class AuthModule {}
