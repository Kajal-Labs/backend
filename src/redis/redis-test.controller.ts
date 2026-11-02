import { Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { RedisService } from './redis.service.js';

@Controller('dev/redis')
export class RedisTestController {
    constructor(private readonly redisService: RedisService) {}

    @Get('ping')
    async ping() {
        const connected = await this.redisService.ping();

        return {
            success: connected,
            message: 'Redis connection successful',
        };
    }

    @Post('test')
    async setTestData() {
        const key = 'kajal:test:redis';

        await this.redisService.set(
            key,
            {
                message: 'Redis is working!',
                timestamp: new Date().toISOString(),
            },
            60,
        );

        return {
            success: true,
            message: 'Data stored successfully',
            key,
            ttl: 60,
        };
    }

    @Get('test')
    async getTestData() {
        const data = await this.redisService.get('kajal:test:redis');

        return {
            success: true,
            data,
        };
    }

    @Delete('test')
    @HttpCode(HttpStatus.OK)
    async deleteTestData() {
        const deleted = await this.redisService.delete('kajal:test:redis');

        return {
            success: true,
            deleted,
        };
    }
}
