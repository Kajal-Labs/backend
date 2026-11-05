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
     */
    async ping(): Promise<boolean> {
        return this.run('PING', async () => {
            const response = await this.redis.ping();

            if (response !== 'PONG') {
                throw new Error('Unexpected Redis ping response');
            }

            return true;
        });
    }

    /**
     * Retrieve a value from Redis.
     *
     * T is a compile-time type only.
     * Validate feature-specific data with Zod when required.
     */
    async get<T>(key: string): Promise<T | null> {
        this.validateKey(key);

        return this.run('GET', () => this.redis.get<T>(key));
    }

    /**
     * Store a JSON-compatible value.
     *
     * TTL is optional and expressed in seconds.
     */
    async set<T extends RedisJsonValue>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        this.validateKey(key);
        this.validateValue(value);
        this.validateTtl(ttlSeconds);

        await this.run('SET', async () => {
            if (ttlSeconds !== undefined) {
                await this.redis.set(key, value, {
                    ex: ttlSeconds,
                });

                return;
            }

            await this.redis.set(key, value);
        });
    }

    /**
     * Atomically store a value only if the key does not exist.
     *
     * Uses Redis SET NX EX.
     *
     * Returns true if created, false if the key already exists.
     */
    async setIfAbsent<T extends RedisJsonValue>(
        key: string,
        value: T,
        ttlSeconds: number,
    ): Promise<boolean> {
        this.validateKey(key);
        this.validateValue(value);
        this.validateTtl(ttlSeconds);

        return this.run('SET NX', async () => {
            const result = await this.redis.set(key, value, {
                ex: ttlSeconds,
                nx: true,
            });

            return result === 'OK';
        });
    }

    /**
     * Delete one or more Redis keys.
     *
     * Returns the number of keys deleted.
     */
    async delete(...keys: string[]): Promise<number> {
        if (keys.length === 0) {
            throw new TypeError('At least one Redis key must be provided.');
        }

        keys.forEach((key) => this.validateKey(key));

        return this.run('DELETE', () => this.redis.del(...keys));
    }

    /**
     * Atomically retrieve and delete a key.
     *
     * Useful for OTPs and one-time verification tokens.
     *
     * Returns null if the key does not exist.
     */
    async getAndDelete<T>(key: string): Promise<T | null> {
        this.validateKey(key);

        return this.run('GET_AND_DELETE', async () => {
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

            return JSON.parse(rawValue) as T;
        });
    }

    /**
     * Run a Lua script atomically.
     *
     * Use this for operations requiring multiple Redis commands
     * to execute as one atomic operation.
     */
    async eval<T>(script: string, keys: string[], args: Array<string | number>): Promise<T> {
        if (script.trim().length === 0) {
            throw new TypeError('Redis Lua script must not be empty.');
        }

        keys.forEach((key) => this.validateKey(key));

        return this.run('EVAL', async () => {
            return await this.redis.eval(script, keys, args);
        });
    }

    /**
     * Validate Redis keys.
     */
    private validateKey(key: string): void {
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw new TypeError('Redis key must be a non-empty string.');
        }
    }

    /**
     * Validate TTL in seconds.
     */
    private validateTtl(ttlSeconds?: number): void {
        if (ttlSeconds !== undefined && (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0)) {
            throw new TypeError('Redis TTL must be a positive integer in seconds.');
        }
    }

    /**
     * Ensure the value is JSON serializable.
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

    /**
     * Centralized Redis error handling.
     */
    private async run<T>(operation: string, fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            this.logger.error(
                `Redis ${operation} failed: ${
                    error instanceof Error ? error.message : 'unknown error'
                }`,
            );

            throw new ServiceUnavailableException('Temporary data store is unavailable.');
        }
    }
}
