import { Injectable } from '@nestjs/common';

import { Argon2Service } from '../password/argon2.service.js';
import { LoginInput } from './login.schema.js';

@Injectable()
export class LoginService {
    constructor(private readonly passwordHasher: Argon2Service) {}

    async login(data: LoginInput) {
        // TODO:
        // 1. Find the user using the email.
        // 2. Handle user-not-found case.
        // 3. Verify the provided password against the stored password hash.
        // 4. Handle invalid credentials.
        // 5. Generate authentication tokens/session if required.
        // 6. Return the appropriate response.
        //
        // IMPORTANT:
        // - Do NOT hardcode users.
        // - Do NOT hardcode passwords or password hashes.
        // - Do NOT expose passwordHash in the response.
        // - Database access should be handled through the appropriate repository/data layer.
        // - Keep business logic inside the service.

        throw new Error('Not implemented');
    }
}
