import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

import { GlobalExceptionFilter, PrismaExceptionFilter } from './common/filters/index.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableShutdownHooks();

    app.setGlobalPrefix('api', {
        exclude: ['/'],
    });

    app.useGlobalFilters(new PrismaExceptionFilter(), new GlobalExceptionFilter());

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
