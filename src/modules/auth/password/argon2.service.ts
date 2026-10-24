import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as argon2 from 'argon2';

import type { PasswordHasher } from './password-hasher.interface.js';

@Injectable()
export class Argon2Service implements PasswordHasher {
    async hash(password: string): Promise<string> {
        this.validatePassword(password);

        try {
            return await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 19_456, // 19 MiB
                timeCost: 2,
                parallelism: 1,
            });
        } catch {
            throw new InternalServerErrorException('Unable to process password');
        }
    }

    async verify(password: string, hash: string): Promise<boolean> {
        if (typeof password !== 'string' || typeof hash !== 'string' || hash.length === 0) {
            return false;
        }

        try {
            return await argon2.verify(hash, password);
        } catch {
            // Malformed hashes must never authenticate.
            return false;
        }
    }

    private validatePassword(password: string): void {
        if (typeof password !== 'string' || password.length === 0) {
            throw new Error('Password must be a non-empty string');
        }

        // Prevent excessive resource consumption.
        if (Buffer.byteLength(password, 'utf8') > 1024) {
            throw new Error('Password exceeds the maximum supported size');
        }
    }
}
