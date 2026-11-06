import { Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { RedisService } from './redis.service.js';

const TEST_TTL_SECONDS = 60;
const TEST_CODE = '012345';

const testPayloadSchema = z.object({
    message: z.string(),
    timestamp: z.string(),
    // Numeric-looking string: must come back as a string, not the number 12345.
    code: z.string(),
});

@Controller('dev/redis')
export class RedisTestController {
    constructor(private readonly redis: RedisService) {}

    private get testKey(): string {
        return this.redis.key('healthcheck'); // -> app:dev:healthcheck
    }

    /** ping() throws ServiceUnavailableException (503) if Redis is unreachable. */
    @Get('ping')
    async ping() {
        await this.redis.ping();

        return { success: true, message: 'Redis connection successful' };
    }

    @Post('test')
    async setTestData() {
        await this.redis.set(
            this.testKey,
            {
                message: 'Redis is working!',
                timestamp: new Date().toISOString(),
                code: TEST_CODE,
            },
            TEST_TTL_SECONDS,
        );

        return {
            success: true,
            message: 'Data stored successfully',
            key: this.testKey,
            ttl: TEST_TTL_SECONDS,
        };
    }

    @Get('test')
    async getTestData() {
        const data = await this.redis.get(this.testKey, testPayloadSchema);

        return {
            success: data !== null,
            // true means the leading zero survived the round trip
            codeIsIntact: data?.code === TEST_CODE,
            data,
        };
    }

    @Delete('test')
    @HttpCode(HttpStatus.OK)
    async deleteTestData() {
        const deleted = await this.redis.delete(this.testKey);

        return { success: deleted > 0, deleted };
    }
}
