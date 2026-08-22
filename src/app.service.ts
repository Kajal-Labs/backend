import { Injectable } from '@nestjs/common';

export interface AppStatus {
    status: string;
    service: string;
    environment: string | undefined;
}

@Injectable()
export class AppService {
    getStatus(): AppStatus {
        return {
            status: 'ok',
            service: 'api',
            environment: process.env.NODE_ENV,
        };
    }
}
