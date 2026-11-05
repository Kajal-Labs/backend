import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

import { REDIS_CLIENT } from './redis.constants.js';
import { RedisService } from './redis.service.js';

import type { Env } from '../../config/env/env.schema.js';

@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env, true>): Redis =>
                new Redis({
                    url: config.get('UPSTASH_REDIS_REST_URL', { infer: true }),
                    token: config.get('UPSTASH_REDIS_REST_TOKEN', { infer: true }),
                }),
        },
        RedisService,
    ],
    exports: [RedisService],
})
export class RedisModule {}
