import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../config/env/env.schema.js';
import { RedisService } from '../../../infra/redis/redis.service.js';
import { OTP_RATE_LIMIT_WINDOW_SECONDS, type OtpPurpose } from './otp.constants.js';

const CONSUME_REQUEST_LUA = `
local userCount = redis.call('INCR', KEYS[1])
if userCount == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end

local ipCount = redis.call('INCR', KEYS[2])
if ipCount == 1 then redis.call('EXPIRE', KEYS[2], ARGV[1]) end

return {userCount, ipCount}
`;

const INCREMENT_WITH_TTL_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count
`;

const rateLimited = (): HttpException =>
    new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);

@Injectable()
export class OtpRateLimiterService {
    private readonly requestUserLimit: number;
    private readonly requestIpLimit: number;
    private readonly verifyIpLimit: number;

    constructor(
        private readonly redis: RedisService,
        config: ConfigService<Env, true>,
    ) {
        this.requestUserLimit = config.get('OTP_REQUEST_USER_LIMIT', { infer: true });
        this.requestIpLimit = config.get('OTP_REQUEST_IP_LIMIT', { infer: true });
        this.verifyIpLimit = config.get('OTP_VERIFY_IP_LIMIT', { infer: true });
    }

    async assertRequestAllowed(
        userId: string | null,
        ipAddress: string | null,
        purpose: OtpPurpose,
    ): Promise<void> {
        const result = await this.consumeRequest(userId, ipAddress, purpose);

        if (result.userLimited || result.ipLimited) {
            throw rateLimited();
        }
    }

    /**
     * Public OTP request endpoints return a generic response for a user-level
     * limit so callers cannot use it to determine whether an account exists.
     * IP limits remain an explicit 429 because they apply equally to every email.
     */
    async isPublicRequestUserLimited(
        userId: string | null,
        ipAddress: string | null,
        purpose: OtpPurpose,
    ): Promise<boolean> {
        const result = await this.consumeRequest(userId, ipAddress, purpose);

        if (result.ipLimited) {
            throw rateLimited();
        }

        return result.userLimited;
    }

    private async consumeRequest(
        userId: string | null,
        ipAddress: string | null,
        purpose: OtpPurpose,
    ): Promise<{ userLimited: boolean; ipLimited: boolean }> {
        if (userId === null) {
            const ipCount = await this.consumeIpRequest(ipAddress);

            return { userLimited: false, ipLimited: ipCount > this.requestIpLimit };
        }

        const counts = await this.redis.eval<[number, number]>(
            CONSUME_REQUEST_LUA,
            [
                this.redis.key('otp', 'req', 'user', userId, purpose),
                this.redis.key('otp', 'req', 'ip', this.normalizeIp(ipAddress)),
            ],
            [OTP_RATE_LIMIT_WINDOW_SECONDS],
        );

        return {
            userLimited: counts[0] > this.requestUserLimit,
            ipLimited: counts[1] > this.requestIpLimit,
        };
    }

    async assertVerificationAllowed(ipAddress: string | null): Promise<void> {
        const count = await this.redis.eval<number>(
            INCREMENT_WITH_TTL_LUA,
            [this.redis.key('otp', 'verify', 'ip', this.normalizeIp(ipAddress))],
            [OTP_RATE_LIMIT_WINDOW_SECONDS],
        );

        if (count > this.verifyIpLimit) {
            throw rateLimited();
        }
    }

    private consumeIpRequest(ipAddress: string | null): Promise<number> {
        return this.redis.eval<number>(
            INCREMENT_WITH_TTL_LUA,
            [this.redis.key('otp', 'req', 'ip', this.normalizeIp(ipAddress))],
            [OTP_RATE_LIMIT_WINDOW_SECONDS],
        );
    }

    private normalizeIp(ipAddress: string | null): string {
        return ipAddress?.trim() || 'unknown';
    }
}
