import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { Argon2Service } from '../password/argon2.service.js';
import { JwtService } from '../jwt/jwt.service.js';

import type { LoginInput } from './login.schema.js';

@Injectable()
export class LoginService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordHasher: Argon2Service,
        private readonly jwtService: JwtService,
    ) {}

    async login(data: LoginInput) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: data.email,
            },
            select: {
                id: true,
                email: true,
                passwordHash: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await this.passwordHasher.verify(data.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const accessToken = await this.jwtService.generateAccessToken({
            sub: user.id,
        });

        return {
            data: {
                accessToken,
                tokenType: 'Bearer',
            },
            message: 'Successfully logged in.',
        };
    }
}
