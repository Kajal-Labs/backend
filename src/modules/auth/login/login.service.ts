import { Injectable } from '@nestjs/common';

import { Argon2Service } from '../password/argon2.service.js';

@Injectable()
export class LoginService {
    constructor(private readonly passwordHasher: Argon2Service) {}

    login(data: any) {
        // TODO: Implement login logic.
        void data;
        throw new Error('Not implemented');
    }
}
