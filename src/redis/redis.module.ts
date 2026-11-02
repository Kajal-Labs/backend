import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

import { REDIS_CLIENT } from './redis.constants.js';
import { RedisService } from './redis.service.js';

@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService): Redis => {
                const url = configService.getOrThrow<string>('UPSTASH_REDIS_REST_URL');

                const token = configService.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN');

                return new Redis({ url, token });
            },
        },
        RedisService,
    ],
    exports: [RedisService],
})
export class RedisModule {}
