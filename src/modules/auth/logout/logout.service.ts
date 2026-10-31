import { Injectable } from '@nestjs/common';

import { SessionService } from '../sessions/sessions.service.js';

@Injectable()
export class LogoutService {
    constructor(private readonly sessionService: SessionService) {}

    async logout(userId: string, sessionId: string): Promise<void> {
        await this.sessionService.revokeSession(userId, sessionId);
    }
}
