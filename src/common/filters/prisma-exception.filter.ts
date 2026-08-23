import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import type { ApiErrorResponse } from '../types/api-response.types.js';

@Catch(
    Prisma.PrismaClientKnownRequestError,
    Prisma.PrismaClientInitializationError,
    Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'DATABASE_ERROR';
        let message = 'Database operation failed';

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002':
                    status = HttpStatus.CONFLICT;
                    code = 'DUPLICATE_RESOURCE';
                    message = 'A record with this value already exists';
                    break;

                case 'P2003':
                    status = HttpStatus.CONFLICT;
                    code = 'FOREIGN_KEY_CONSTRAINT';
                    message = 'Related record constraint failed';
                    break;

                case 'P2025':
                    status = HttpStatus.NOT_FOUND;
                    code = 'RECORD_NOT_FOUND';
                    message = 'Record not found';
                    break;
            }
        }

        if (exception instanceof Prisma.PrismaClientInitializationError) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            code = 'DATABASE_UNAVAILABLE';
            message = 'Database service unavailable';
        }

        this.logger.error(exception);

        const errorResponse: ApiErrorResponse = {
            success: false,
            error: {
                code,
                message,
            },
        };

        response.status(status).json(errorResponse);
    }
}
