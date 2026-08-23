import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { ZodError, type ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T = unknown> implements PipeTransform<unknown, T> {
    constructor(private readonly schema: ZodType<T>) {}

    transform(value: unknown): T {
        const result = this.schema.safeParse(value);

        if (!result.success) {
            throw new BadRequestException({
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: this.formatErrors(result.error),
            });
        }

        return result.data;
    }

    private formatErrors(error: ZodError) {
        return error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
        }));
    }
}
