import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';

import { Argon2Service } from '../password/argon2.service.js';
import { RedisService } from '../../../infra/redis/redis.service.js';

import {
    MAX_ATTEMPTS,
    OTP_LENGTH,
    OTP_PATTERN,
    RESEND_COOLDOWN_SECONDS,
    TTL_SECONDS,
    type OtpPurpose,
} from './otp.constants.js';

const CONSUME_ATTEMPT_LUA = `
local hash = redis.call('GET', KEYS[1])
if not hash then return nil end

local attempts = redis.call('INCR', KEYS[2])
if attempts == 1 then redis.call('EXPIRE', KEYS[2], ARGV[2]) end

if attempts > tonumber(ARGV[1]) then
  redis.call('DEL', KEYS[1], KEYS[2])
  return nil
end

return hash
`;

@Injectable()
export class OtpService {
    constructor(
        private readonly redis: RedisService,
        private readonly otpHasher: Argon2Service,
    ) {}

    private keys(purpose: OtpPurpose, identifier: string) {
        const id = identifier.trim().toLowerCase();

        return {
            otp: this.redis.key('otp', purpose, id),
            attempts: this.redis.key('otp', purpose, id, 'attempts'),
            cooldown: this.redis.key('otp', purpose, id, 'cooldown'),
        };
    }

    async issue(purpose: OtpPurpose, identifier: string): Promise<string> {
        const k = this.keys(purpose, identifier);

        const allowed = await this.redis.setIfAbsent(k.cooldown, 1, RESEND_COOLDOWN_SECONDS);

        if (!allowed) {
            throw new HttpException(
                'Please wait before requesting another otp.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        try {
            const otp = randomInt(0, 10 ** OTP_LENGTH)
                .toString()
                .padStart(OTP_LENGTH, '0');

            const hash = await this.otpHasher.hash(otp); // <-- await added

            await this.redis.set(k.otp, hash, TTL_SECONDS[purpose]);
            await this.redis.delete(k.attempts);

            return otp;
        } catch (error) {
            await this.redis.delete(k.cooldown).catch(() => undefined);

            throw error;
        }
    }

    async verify(purpose: OtpPurpose, identifier: string, otp: string): Promise<boolean> {
        if (!OTP_PATTERN.test(otp)) return false;

        const k = this.keys(purpose, identifier);

        const stored = await this.redis.eval<string | null>(
            CONSUME_ATTEMPT_LUA,
            [k.otp, k.attempts],
            [MAX_ATTEMPTS, TTL_SECONDS[purpose]],
        );

        if (!stored) return false;

        const hash = JSON.parse(stored) as string;

        if (!(await this.otpHasher.verify(otp, hash))) return false;

        if ((await this.redis.delete(k.otp)) !== 1) return false;

        await this.redis.delete(k.attempts).catch(() => undefined);

        return true;
    }

    async invalidate(purpose: OtpPurpose, identifier: string): Promise<void> {
        const k = this.keys(purpose, identifier);

        await this.redis.delete(k.otp, k.attempts, k.cooldown);
    }
}
