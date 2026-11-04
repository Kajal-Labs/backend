import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { HealthController } from './health/health.controller.js';

import type { Env } from './config/env/env.schema.js';
import { validateEnv } from './config/env/env.validation.js';

import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            validate: validateEnv,
        }),

        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env, true>) => ({
                pinoHttp: {
                    level: config.get('LOG_LEVEL', { infer: true }),

                    genReqId: (req) => {
                        const incoming = req.headers['x-request-id'];

                        return typeof incoming === 'string' && incoming.length <= 128
                            ? incoming
                            : randomUUID();
                    },

                    redact: [
                        'req.headers.authorization',
                        'req.headers.cookie',
                        'res.headers["set-cookie"]',
                    ],

                    autoLogging: {
                        ignore: (req) => req.url === '/health',
                    },

                    transport:
                        config.get('NODE_ENV', { infer: true }) === 'development'
                            ? {
                                  target: 'pino-pretty',
                                  options: {
                                      singleLine: true,
                                  },
                              }
                            : undefined,
                },
            }),
        }),

        DatabaseModule,
        RedisModule,
        AuthModule,
    ],

    controllers: [AppController, HealthController],

    providers: [AppService],
})
export class AppModule {}
