import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

import { REDIS_CLIENT } from './redis.constants.js';
import { RedisService } from './redis.service.js';

import type { Env } from '../../config/env/env.schema.js';

import { RedisTestController } from './redis-test.controller.js';

@Global()
@Module({
    controllers: [RedisTestController],
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env, true>): Redis =>
                new Redis({
                    url: config.get('UPSTASH_REDIS_REST_URL', { infer: true }),
                    token: config.get('UPSTASH_REDIS_REST_TOKEN', { infer: true }),
                    // We JSON-encode/decode ourselves so "012345" never becomes 12345.
                    automaticDeserialization: false,
                    retry: {
                        retries: 3,
                        backoff: (attempt) => Math.min(Math.exp(attempt) * 50, 1_000),
                    },
                    // Never let a slow Redis hang an HTTP request.
                    signal: () => AbortSignal.timeout(5_000),
                }),
        },
        RedisService,
    ],
    exports: [RedisService],
})
export class RedisModule {}
