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

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null &&
                'message' in exceptionResponse
            ) {
                const responseMessage = (
                    exceptionResponse as {
                        message?: string | string[];
                    }
                ).message;

                message = Array.isArray(responseMessage)
                    ? responseMessage.join(', ')
                    : (responseMessage ?? 'Request failed');
            }

            const errorResponse: ApiErrorResponse = {
                success: false,
                error: {
                    code: this.getErrorCode(status),
                    message,
                },
            };

            response.status(status).json(errorResponse);
            return;
        }

        this.logger.error(exception);

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
