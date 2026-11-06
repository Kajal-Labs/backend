import { Module } from '@nestjs/common';

import { OtpService } from './otp.service.js';
import { Argon2Service } from '../password/argon2.service.js';
import { OtpTestController } from './otp-test.controller.js';
import { OtpEmailService } from './otp-email.service.js';

@Module({
    controllers: [OtpTestController],
    providers: [OtpService, OtpEmailService, Argon2Service],
    exports: [OtpService, OtpEmailService],
})
export class OtpModule {}
