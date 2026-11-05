import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { HealthController } from './health/health.controller.js';

import type { Env } from './config/env/env.schema.js';
import { validateEnv } from './config/env/env.validation.js';

import { RedisModule } from './infra/redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './infra/database/database.module.js';

import { createLoggerConfig } from './config/logger/logger.config.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            validate: validateEnv,
        }),

        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env, true>) => createLoggerConfig(config),
        }),

        DatabaseModule,
        RedisModule,
        AuthModule,
    ],

    controllers: [AppController, HealthController],

    providers: [AppService],
})
export class AppModule {}
