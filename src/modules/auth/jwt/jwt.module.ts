import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

import { JwtService } from './jwt.service.js';

@Module({
    imports: [NestJwtModule.register({})],
    providers: [JwtService],
    exports: [JwtService],
})
export class AuthJwtModule {}
