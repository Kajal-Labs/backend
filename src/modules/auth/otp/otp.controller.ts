import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { OtpWorkflowService } from './otp-workflow.service.js';
import {
    otpRequestSchema,
    otpVerifySchema,
    type OtpRequestInput,
    type OtpVerifyInput,
} from './otp.schema.js';

@Controller('auth/otp')
export class OtpController {
    constructor(private readonly otpWorkflow: OtpWorkflowService) {}

    @Post('request')
    @HttpCode(HttpStatus.OK)
    async request(
        @Body(new ZodValidationPipe(otpRequestSchema)) body: OtpRequestInput,
        @Req() request: Request,
    ) {
        await this.otpWorkflow.request(body, request.ip ?? null);

        return {
            data: null,
            message: 'If an eligible account exists, a verification code has been sent.',
        };
    }

    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verify(
        @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyInput,
        @Req() request: Request,
    ) {
        await this.otpWorkflow.verify(body, request.ip ?? null);

        return {
            data: { verified: true },
            message: 'Verification code accepted.',
        };
    }
}
