import { Injectable } from '@nestjs/common';

import { PasswordHasher } from './password-hasher.interface.js';

@Injectable()
export class Argon2Service implements PasswordHasher {
    async hash(password: string): Promise<string> {
        // TODO:
        // Hash the plain-text password using Argon2.
        //
        // Requirements:
        // - Use Argon2id.
        // - Never store plain-text passwords.
        // - Return the generated password hash.

        throw new Error('Not implemented');
    }

    async verify(password: string, hash: string): Promise<boolean> {
        // TODO:
        // Verify the provided plain-text password against the stored hash.
        //
        // Requirements:
        // - Return true when the password matches.
        // - Return false when the password does not match.
        // - Do not expose the stored password hash.

        throw new Error('Not implemented');
    }
}
