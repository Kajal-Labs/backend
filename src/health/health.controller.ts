import { Controller, Get, SetMetadata, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';

import type { Env } from '../config/env/env.schema.js';
import { PrismaService } from '../infra/database/prisma/prisma.service.js';
import { RedisService } from '../infra/redis/redis.service.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('health')
@Public()
@SkipThrottle()
export class HealthController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly config: ConfigService<Env, true>,
    ) {}

    @Get()
    async check() {
        const environment = this.config.get('NODE_ENV', { infer: true });

        const [database, redis] = await Promise.allSettled([
            this.prisma.$queryRaw`SELECT 1`,
            this.redis.ping(),
        ]);

        const checks = {
            redis: redis.status === 'fulfilled' ? 'up' : 'down',
            database: database.status === 'fulfilled' ? 'up' : 'down',
        };

        if (database.status === 'rejected' || redis.status === 'rejected') {
            throw new ServiceUnavailableException({
                code: 'UNHEALTHY',
                message: 'Service is unhealthy',
                environment,
                details: checks,
            });
        }

        return {
            status: 'ok',
            ...checks,
            environment,
        };
    }
}
