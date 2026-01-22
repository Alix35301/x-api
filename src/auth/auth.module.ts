import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RefreshTokens } from '../users/entities/refresh_tokens.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokens]),
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '15') * 60 * 1000 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
