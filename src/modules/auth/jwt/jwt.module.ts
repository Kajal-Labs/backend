import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

import { JwtService } from './jwt.service.js';

@Module({
    imports: [
        NestJwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_ACCESS_SECRET');

                if (!secret) {
                    throw new Error('JWT_ACCESS_SECRET is not defined');
                }

                return {
                    secret,
                    signOptions: {
                        expiresIn: '15m',
                    },
                };
            },
        }),
    ],
    providers: [JwtService],
    exports: [JwtService],
})
export class AuthJwtModule {}
