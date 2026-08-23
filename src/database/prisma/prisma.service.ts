import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(private readonly configService: ConfigService) {
        const connectionString = configService.getOrThrow<string>('DATABASE_URL');

        const adapter = new PrismaPg({
            connectionString,
            max: configService.get<number>('DATABASE_POOL_MAX') ?? 10,
            connectionTimeoutMillis:
                configService.get<number>('DATABASE_CONNECTION_TIMEOUT_MS') ?? 5000,
            idleTimeoutMillis: 30_000,
        });

        super({
            adapter,
            log: ['error', 'warn'],
        });
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.$connect();
            await this.$queryRaw`SELECT 1`;

            this.logger.log('🚀 PostgreSQL database connected successfully! 🐘');
        } catch (error) {
            this.logger.error(
                '❌ PostgreSQL database connection failed! 💥',
                // error instanceof Error ? error.message : String(error),
            );
            throw error;
        }
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.$disconnect();

            this.logger.log('👋 PostgreSQL database disconnected successfully! 🐘');
        } catch (error) {
            this.logger.error('❌ PostgreSQL database disconnection failed! 💥', error);
        }
    }
}
