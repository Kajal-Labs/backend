import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { detectDeviceMetadata, type RequestMetadata } from './session-metadata.util.js';

@Injectable()
export class SessionService {
    private readonly ttlSeconds: number;

    constructor(
        private readonly prisma: PrismaService,
        config: ConfigService,
    ) {
        this.ttlSeconds = config.getOrThrow<number>('SESSION_TTL_SECONDS');
    }

    createSession(userId: string, metadata: RequestMetadata) {
        const device = detectDeviceMetadata(metadata.userAgent);

        return this.prisma.session.create({
            data: {
                userId,
                expiresAt: new Date(Date.now() + this.ttlSeconds * 1000),
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent,
                deviceName: device.deviceName,
                deviceType: device.deviceType,
            },
            select: { id: true, expiresAt: true },
        });
    }

    findActiveSessions(userId: string) {
        const now = new Date();

        return this.prisma.session.findMany({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: now },
            },
            select: {
                id: true,
                ipAddress: true,
                deviceName: true,
                deviceType: true,
                expiresAt: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async revokeSession(userId: string, sessionId: string): Promise<void> {
        const result = await this.prisma.session.updateMany({
            where: { id: sessionId, userId, isActive: true },
            data: { isActive: false, revokedAt: new Date() },
        });

        if (result.count === 0) {
            throw new NotFoundException('Session not found');
        }
    }

    async revokeAllSessions(userId: string): Promise<number> {
        const result = await this.prisma.session.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false, revokedAt: new Date() },
        });

        return result.count;
    }
}
