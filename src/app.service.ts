import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './config/env/env.schema.js';

export interface AppStatus {
    status: 'ok';
    service: string;
    environment: string;
    message: string;
}

@Injectable()
export class AppService {
    constructor(private readonly config: ConfigService<Env, true>) {}

    getStatus(): AppStatus {
        return {
            status: 'ok',
            service: 'Kajal API',
            environment: this.config.get('NODE_ENV', { infer: true }),
            message: 'API is running and ready to accept requests.',
        };
    }
}
