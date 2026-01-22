import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import bcrypt from 'bcrypt';
import { RefreshTokens } from './entities/refresh_tokens.entity';
import type { Request } from 'express';
import { DeviceServiceService } from '../device-service/device-service.service';
import dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshTokens)
    private readonly refreshTokenRepo: Repository<RefreshTokens>,
    private readonly deviceService: DeviceServiceService,
    private readonly configService: ConfigService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    return await this.userRepo.save(createUserDto);
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    return await this.userRepo.findOneBy({ id: id });
  }

  async findOneByEmail(email: string) {
    return await this.userRepo.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepo.save(updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async createRefreshToken(data: {
    user: { id: string };
    request: Request;
  }): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const hashed_token = await bcrypt.hash(token, 10);
    this.refreshTokenRepo.save({
      user_id: parseInt(data.user.id),
      token_hash: hashed_token,
      created_at: new Date(),
      device_name: this.deviceService.parse(data.request.headers['user-agent']),
      ip_address:
        (data.request.headers['x-forwarded-for'] as string) ||
        (data.request.ip as string),
      user_agent: data.request.headers['user-agent'],
      expires_at: dayjs()
        .add(this.configService.get('REFRESH_EXPIRES_IN') || 7, 'day')
        .toDate(),
    });
    return token;
  }
}
