import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

import { JwtService } from './jwt.service.js';

// Secret and options are passed per call in JwtService, so nothing is configured here.
@Module({
    imports: [NestJwtModule.register({})],
    providers: [JwtService],
    exports: [JwtService],
})
export class AuthJwtModule {}
