import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedRequest } from '../guards/authenticated-request.interface.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { sessionIdSchema, type SessionIdParams } from './session-id.schema.js';
import { SessionService } from './sessions.service.js';

@Controller('auth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
    constructor(private readonly sessionService: SessionService) {}

    @Get()
    async getSessions(@Req() req: AuthenticatedRequest) {
        const sessions = await this.sessionService.findActiveSessions(req.user.id);

        return {
            data: sessions.map((session) => ({
                ...session,
                isCurrent: session.id === req.user.sessionId,
            })),
            message: 'Sessions retrieved successfully.',
        };
    }

    @Delete(':sessionId')
    async revokeSession(
        @Req() req: AuthenticatedRequest,
        @Param(new ZodValidationPipe(sessionIdSchema)) params: SessionIdParams,
    ) {
        await this.sessionService.revokeSession(req.user.id, params.sessionId);

        return { data: null, message: 'Session revoked successfully.' };
    }

    @Delete()
    async revokeAllSessions(@Req() req: AuthenticatedRequest) {
        const revokedCount = await this.sessionService.revokeAllSessions(req.user.id);

        return { data: { revokedCount }, message: 'Sessions revoked successfully.' };
    }
}
