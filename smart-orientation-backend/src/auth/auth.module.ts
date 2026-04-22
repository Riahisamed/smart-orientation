import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 أضف هذا
import { AuthEmailService } from './auth-email.service';

@Module({
imports: [
  PrismaModule,
  ConfigModule,
  PassportModule.register({ defaultStrategy: 'jwt' }),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET') || 'supersecretkey',
      signOptions: { expiresIn: '1d' },
    }),
  }),
],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthEmailService],
  exports: [PassportModule], // 👈 مهم
})
export class AuthModule {}