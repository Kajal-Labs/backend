import { Injectable } from '@nestjs/common';

import { Argon2Service } from '../password/argon2.service.js';

@Injectable()
export class RegistrationService {
    constructor(private readonly passwordHasher: Argon2Service) {}

    register(data: any) {
        // TODO: Implement registration logic.
        void data;
        throw new Error('Not implemented');
    }
}
