import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';

import type { Response } from 'express';
import type { ApiErrorResponse } from '../types/api-response.types.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            let message = 'Request failed';
            let details: unknown[] | undefined;

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const body = exceptionResponse as Record<string, unknown>;

                const responseMessage = body.message;

                if (typeof responseMessage === 'string') {
                    message = responseMessage;
                } else if (Array.isArray(responseMessage)) {
                    message = responseMessage.join(', ');
                }

                if (Array.isArray(body.details)) {
                    details = body.details;
                }
            }

            const errorResponse: ApiErrorResponse = {
                success: false,
                error: {
                    code:
                        exceptionResponse !== null &&
                        typeof exceptionResponse === 'object' &&
                        'code' in exceptionResponse &&
                        typeof exceptionResponse.code === 'string'
                            ? exceptionResponse.code
                            : this.getErrorCode(status),
                    message,
                    ...(details ? { details } : {}),
                },
            };

            response.status(status).json(errorResponse);
            return;
        }

        this.logger.error(
            'Unhandled exception',
            exception instanceof Error ? exception.stack : String(exception),
        );

        const errorResponse: ApiErrorResponse = {
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
            },
        };

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }

    private getErrorCode(status: number): string {
        const codes: Record<number, string> = {
            [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
            [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
            [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
            [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
            [HttpStatus.CONFLICT]: 'CONFLICT',
            [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
            [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
        };

        return codes[status] ?? 'HTTP_ERROR';
    }
}
