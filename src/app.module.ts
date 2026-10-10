import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { validateEnv } from './config/env/env.validation.js';
import { DatabaseModule } from './database/database.module.js';

import { AuthModule } from './modules/auth/auth.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        DatabaseModule,

        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
