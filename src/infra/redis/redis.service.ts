import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';
import type { ZodType } from 'zod';

import { REDIS_CLIENT } from './redis.constants.js';

import { ENV_LABELS } from './redis.constants.js';
import type { Env } from '../../config/env/env.schema.js';

/**
 * Low-level Redis access. Every value is stored as a JSON string.
 * Throws ServiceUnavailableException when Redis is unreachable;
 * callers (cache, otp, tokens) decide whether to fail open or closed.
 */
@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);
    private readonly prefix: string;

    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        config: ConfigService<Env, true>,
    ) {
        const appName = config.get('APP_NAME', { infer: true });
        const env = ENV_LABELS[config.get('NODE_ENV', { infer: true })];

        this.prefix = `${appName}:${env}:`;
    }

    /**
     * Build a namespaced key.
     * key('otp', 'login', 'a@b.com') -> "myapp:prod:otp:login:a@b.com"
     */
    key(...parts: string[]): string {
        if (parts.length === 0 || parts.some((p) => p.length === 0)) {
            throw new TypeError('Redis key parts must be non-empty.');
        }

        return this.prefix + parts.join(':');
    }

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
     * Get a value. Returns null if the key is missing, the data is corrupt,
     * or it fails the optional Zod schema (stale shape after a deploy = miss).
     */
    async get<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
        this.validateKey(key);

        const raw = await this.run('GET', () => this.redis.get<string>(key));

        return this.parse<T>(key, raw, schema);
    }

    /** Store a JSON-serializable value. TTL (seconds) is optional. */
    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        this.validateKey(key);
        this.validateTtl(ttlSeconds);

        const serialized = this.serialize(value);

        await this.run('SET', async () => {
            if (ttlSeconds !== undefined) {
                await this.redis.set(key, serialized, { ex: ttlSeconds });
                return;
            }

            await this.redis.set(key, serialized);
        });
    }

    /**
     * Atomic SET NX EX. Returns true if created, false if the key already exists.
     * Used for cooldowns and locks.
     */
    async setIfAbsent(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
        this.validateKey(key);
        this.validateTtl(ttlSeconds);

        const serialized = this.serialize(value);

        return this.run('SET NX', async () => {
            const result = await this.redis.set(key, serialized, { ex: ttlSeconds, nx: true });

            return result === 'OK';
        });
    }

    /** Delete keys. Returns the number of keys deleted. */
    async delete(...keys: string[]): Promise<number> {
        if (keys.length === 0) {
            throw new TypeError('At least one Redis key must be provided.');
        }

        keys.forEach((key) => this.validateKey(key));

        return this.run('DEL', () => this.redis.del(...keys));
    }

    /** Atomic GETDEL. Single-use values (tokens). Returns null if missing. */
    async getAndDelete<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
        this.validateKey(key);

        const raw = await this.run('GETDEL', () => this.redis.getdel<string>(key));

        return this.parse<T>(key, raw, schema);
    }

    /**
     * Run a Lua script atomically. The result is returned RAW (not parsed):
     * values written with set() are JSON strings, so parse them if you return one.
     */
    async eval<T>(script: string, keys: string[], args: Array<string | number>): Promise<T> {
        if (script.trim().length === 0) {
            throw new TypeError('Redis Lua script must not be empty.');
        }

        keys.forEach((key) => this.validateKey(key));

        return this.run('EVAL', () =>
            this.redis.eval<Array<string | number>, T>(script, keys, args),
        );
    }

    private parse<T>(key: string, raw: string | null, schema?: ZodType<T>): T | null {
        if (raw === null) {
            return null;
        }

        let value: unknown;

        try {
            value = JSON.parse(raw);
        } catch {
            this.logger.warn(`Corrupt JSON at key "${key}", treating as missing.`);
            return null;
        }

        if (!schema) {
            return value as T;
        }

        const result = schema.safeParse(value);

        if (!result.success) {
            this.logger.warn(`Schema mismatch at key "${key}", treating as missing.`);
            return null;
        }

        return result.data;
    }

    private serialize(value: unknown): string {
        const serialized = JSON.stringify(value);

        if (serialized === undefined) {
            throw new TypeError('Redis value must be JSON serializable.');
        }

        return serialized;
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

    private async run<T>(operation: string, fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            this.logger.error(
                `Redis ${operation} failed: ${error instanceof Error ? error.message : 'unknown error'}`,
            );

            throw new ServiceUnavailableException('Temporary data store is unavailable.');
        }
    }
}
