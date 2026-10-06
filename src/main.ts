import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter, PrismaExceptionFilter } from './common/filters/index.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableShutdownHooks();

    app.setGlobalPrefix('api', {
        exclude: ['/'],
    });

    app.useGlobalFilters(new PrismaExceptionFilter(), new GlobalExceptionFilter());

    const config = new DocumentBuilder()
        .setTitle('My API')
        .setDescription('My NestJS API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, documentFactory);

    await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
