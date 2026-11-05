import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { RequestMethod } from '@nestjs/common';

import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';

import type { Env } from './config/env/env.schema.js';

import { GlobalExceptionFilter, PrismaExceptionFilter } from './common/filters/index.js';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor.js';

import { API_PREFIX } from './common/constants.js';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

    const config = app.get<ConfigService<Env, true>>(ConfigService);

    app.useLogger(app.get(Logger));
    app.enableShutdownHooks();

    app.set('trust proxy', config.get('TRUST_PROXY', { infer: true }));

    app.use(helmet());
    app.use(cookieParser());

    const origins = config
        .get('CORS_ORIGINS', { infer: true })
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (origins.length > 0) {
        app.enableCors({ origin: origins, credentials: true });
    }

    app.setGlobalPrefix(API_PREFIX, {
        exclude: ['/', { path: 'health', method: RequestMethod.GET }],
    });

    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new PrismaExceptionFilter(), new GlobalExceptionFilter());

    await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
