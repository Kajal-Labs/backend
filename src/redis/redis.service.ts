import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Redis } from '@upstash/redis';

import { REDIS_CLIENT } from './redis.constants.js';
import type { RedisJsonValue } from './redis.types.js';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) {}

    /**
     * Check Redis connectivity.
     *
     * Throws when Redis is unavailable or returns an unexpected response.
     */
    async ping(): Promise<boolean> {
        try {
            const response = await this.redis.ping();

            if (response !== 'PONG') {
                throw new Error('Unexpected Redis ping response');
            }

            return true;
        } catch {
            this.logger.error('Redis connectivity check failed.');

            throw new ServiceUnavailableException('Redis service is currently unavailable.');
        }
    }

    /**
     * Retrieve a value from Redis.
     *
     * @returns The stored value or null if the key does not exist.
     *
     * Note: T is a compile-time type only. Validate data with Zod when
     * reading feature-specific records.
     */
    async get<T>(key: string): Promise<T | null> {
        this.validateKey(key);

        try {
            return await this.redis.get<T>(key);
        } catch {
            this.logger.error('Redis GET operation failed.');

            throw new ServiceUnavailableException('Unable to retrieve temporary data.');
        }
    }

    /**
     * Store a JSON-compatible value in Redis.
     *
     * @param key Redis key.
     * @param value Value to store.
     * @param ttlSeconds Optional expiration time in seconds.
     */
    async set<T extends RedisJsonValue>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        this.validateKey(key);
        this.validateValue(value);
        this.validateTtl(ttlSeconds);

        try {
            if (ttlSeconds !== undefined) {
                await this.redis.set(key, value, {
                    ex: ttlSeconds,
                });

                return;
            }

            await this.redis.set(key, value);
        } catch {
            this.logger.error('Redis SET operation failed.');

            throw new ServiceUnavailableException('Unable to store temporary data.');
        }
    }

    /**
     * Delete a key from Redis.
     *
     * @returns True if the key existed and was deleted.
     */
    async delete(key: string): Promise<boolean> {
        this.validateKey(key);

        try {
            const deleted = await this.redis.del(key);

            return deleted > 0;
        } catch {
            this.logger.error('Redis DELETE operation failed.');

            throw new ServiceUnavailableException('Unable to delete temporary data.');
        }
    }

    /**
     * Atomically retrieve and delete a key.
     *
     * Useful for OTPs and one-time verification tokens.
     *
     * The value is parsed as JSON and returned as unknown so the caller
     * can validate it using its own schema.
     */
    async getAndDelete(key: string): Promise<unknown> {
        this.validateKey(key);

        try {
            const script = `
                local value = redis.call('GET', KEYS[1])

                if value then
                    redis.call('DEL', KEYS[1])
                end

                return value
            `;

            const rawValue = await this.redis.eval(script, [key], []);

            if (rawValue === null) {
                return null;
            }

            if (typeof rawValue !== 'string') {
                throw new Error('Unexpected Redis response');
            }

            return JSON.parse(rawValue) as unknown;
        } catch {
            this.logger.error('Redis GET_AND_DELETE operation failed.');

            throw new ServiceUnavailableException('Unable to retrieve temporary data.');
        }
    }

    private validateKey(key: string): void {
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw new TypeError('Redis key must be a non-empty string.');
        }
    }

    private validateTtl(ttlSeconds?: number): void {
        if (ttlSeconds !== undefined && (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0)) {
            throw new TypeError('Redis TTL must be a positive integer in seconds.');
        }
    }

    /**
     * Validate that the value can be serialized as JSON.
     *
     * JSON.stringify catches circular references and unsupported values
     * such as BigInt. This is intentionally simpler than a custom
     * recursive validator.
     */
    private validateValue(value: RedisJsonValue): void {
        try {
            const serialized = JSON.stringify(value);

            if (serialized === undefined) {
                throw new TypeError('Redis value must be JSON serializable.');
            }
        } catch {
            throw new TypeError('Redis value must be JSON serializable.');
        }
    }
}
