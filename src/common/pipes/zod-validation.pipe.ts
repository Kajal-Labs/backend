import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

import { z, type ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T = unknown> implements PipeTransform<unknown, T> {
    constructor(private readonly schema: ZodType<T>) {}

    transform(value: unknown): T {
        const result = this.schema.safeParse(value);

        if (!result.success) {
            throw new BadRequestException({
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: result.error.issues.map((issue) => ({
                    field: issue.path.join('.') || '(root)',
                    message: issue.message,
                    code: issue.code,
                })),
            });
        }

        return result.data;
    }
}
