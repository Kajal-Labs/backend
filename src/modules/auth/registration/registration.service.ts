import { Injectable } from '@nestjs/common';

import { Argon2Service } from '../password/argon2.service.js';
import { RegisterInput } from './registration.schema.js';

@Injectable()
export class RegistrationService {
    constructor(private readonly passwordHasher: Argon2Service) {}

    async register(data: RegisterInput) {
        // TODO:
        // 1. Check whether the email is already registered.
        // 2. Validate/check any required user information.
        // 3. Hash the user's password using PasswordHasher/Argon2Service.
        // 4. Create the user through the appropriate data/repository layer.
        // 5. Do NOT store the plain-text password.
        // 6. Return a safe response without exposing passwordHash.
        //
        // IMPORTANT:
        // - Do NOT access the database directly from the controller.
        // - Do NOT hardcode users or passwords.
        // - Keep registration business logic inside this service.

        throw new Error('Not implemented');
    }
}
