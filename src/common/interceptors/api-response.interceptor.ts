import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import type { ApiSuccessResponse } from '../types/api-response.types.js';

interface ResponseWithMessage<T> {
    data: T;
    message?: string;
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
    T | ResponseWithMessage<unknown>,
    ApiSuccessResponse<T>
> {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
        return next.handle().pipe(
            map((result: T | ResponseWithMessage<T>) => {
                if (
                    typeof result === 'object' &&
                    result !== null &&
                    'data' in result &&
                    'message' in result
                ) {
                    return {
                        success: true,
                        data: result.data,
                        message: result.message,
                    };
                }

                return {
                    success: true,
                    data: result as T,
                };
            }),
        );
    }
}
