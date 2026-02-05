import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserDto } from './dto/user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokens } from '../users/entities/refresh_tokens.entity';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshTokens)
    private readonly refreshTokenRepo: Repository<RefreshTokens>,
  ) { }

  async login(userDto: UserDto, request: Request) {
    try {
      const user = await this.userService.findOneByEmail(userDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (!(await bcrypt.compare(userDto.password, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return {
        token: this.jwtService.sign({ id: user.id, email: user.email }),
        refresh_token: await this.userService.createRefreshToken({
          user: { id: user.id.toString() },
          request: request,
        }),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  async refresh(token: string) {
    const tokenRecord = await this.refreshTokenRepo.findOneBy({
      token_hash: token,
      revoked_at: null,
    });
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userService.findOne(tokenRecord.user_id as number);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (dayjs(tokenRecord.expires_at).isAfter(dayjs())) {
      const token = this.jwtService.sign({ id: user.id, email: user.email });
      this.refreshTokenRepo.update(
        { id: tokenRecord.id },
        {
          last_used_at: new Date()
        }
      )
      return {
        token: token
      }
    } else {
      throw new UnauthorizedException('refresh token is expired');
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userService.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }

  async me(request: Request) {
    const userPayload = request['user'];
    if (!userPayload) {
      throw new UnauthorizedException('User not authenticated');
    }
    const user = await this.userService.findOne(userPayload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
  }
}
