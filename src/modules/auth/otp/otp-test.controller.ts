import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { OtpService } from './otp.service.js';

const purposeSchema = z.enum(['login', 'verify-email', 'reset-password']);

const issueSchema = z.object({
    purpose: purposeSchema,
    identifier: z.string().trim().min(1).max(254),
});

const verifySchema = issueSchema.extend({
    // Deliberately loose: lets you test that malformed OTPs are rejected by the service.
    otp: z.string().max(32),
});

type IssueDto = z.infer<typeof issueSchema>;
type VerifyDto = z.infer<typeof verifySchema>;

/**
 * Dev-only playground for OtpService. Returns the plain OTP in the response,
 * which is exactly why DevOnlyGuard must stay on (404 in production).
 */
@Controller('dev/otp')
export class OtpTestController {
    constructor(private readonly otpService: OtpService) {}

    @Post('issue')
    @HttpCode(HttpStatus.OK)
    async issue(@Body(new ZodValidationPipe(issueSchema)) body: IssueDto) {
        const otp = await this.otpService.issue(body.purpose, body.identifier);

        return { purpose: body.purpose, identifier: body.identifier, otp };
    }

    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verify(@Body(new ZodValidationPipe(verifySchema)) body: VerifyDto) {
        const valid = await this.otpService.verify(body.purpose, body.identifier, body.otp);

        return { valid };
    }
}
