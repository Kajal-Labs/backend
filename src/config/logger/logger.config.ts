import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import type { ConfigService } from '@nestjs/config';
import type { Env } from '../env/env.schema.js';

export function createLoggerConfig(config: ConfigService<Env, true>) {
    return {
        pinoHttp: {
            level: config.get('LOG_LEVEL', { infer: true }),

            genReqId: (req: { headers: Record<string, unknown> }) => {
                const incoming = req.headers['x-request-id'];

                return typeof incoming === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(incoming)
                    ? incoming
                    : randomUUID();
            },

            customLogLevel: (_req: unknown, res: { statusCode: number }, err: unknown) => {
                if (err || res.statusCode >= 500) {
                    return 'error';
                }

                if (res.statusCode >= 400) {
                    return 'warn';
                }

                return 'info';
            },

            serializers: {
                req: (req: { id: string; method: string; url?: string }) => ({
                    id: req.id,
                    method: req.method,
                    url: req.url?.split('?')[0],
                }),

                res: (res: { statusCode: number }) => ({
                    statusCode: res.statusCode,
                }),
            },

            redact: {
                paths: [
                    'req.headers.authorization',
                    'req.headers.cookie',
                    'res.headers.set-cookie',
                    'req.body.password',
                    'req.body.refreshToken',
                    'req.body.accessToken',
                ],
                censor: '[Redacted]',
            },

            autoLogging: {
                ignore: (req: IncomingMessage) => {
                    const url = req.url ?? '';

                    return url === '/health' || url.startsWith('/api/v1/health');
                },
            },

            transport:
                config.get('NODE_ENV', { infer: true }) === 'development'
                    ? {
                          target: 'pino-pretty',
                          options: {
                              colorize: true,
                              translateTime: 'SYS:standard',
                              ignore: 'pid,hostname',
                              singleLine: false,
                              levelFirst: true,
                          },
                      }
                    : undefined,
        },
    };
}
