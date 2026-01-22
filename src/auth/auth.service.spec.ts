import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { UserDto } from './dto/user.dto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshTokens } from '../users/entities/refresh_tokens.entity';
import { Request } from 'express';

describe('AuthService', () => {
  let service: AuthService;
  let configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test';
      }
      return null;
    }),
  };
  const req = {} as Request;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    createRefreshToken: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(() => 'token12312'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: getRepositoryToken(RefreshTokens),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', async () => {
    await expect(service).toBeDefined();
  });

  it('return unauthorized exception if user is not found', async () => {
    const userDto: UserDto = {
      email: 'test@test.com',
      password: '123456',
    };
    return await expect(service.login(userDto, req)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('return unauthorized exception if password is incorrect', async () => {
    const userDto: UserDto = {
      email: 'test@test.com',
      password: '123456',
    };
    return await expect(service.login(userDto, req)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('return token and user if login is successful', async () => {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const mockUser: User = {
      id: 1,
      name: 'test',
      email: 'test@test.com',
      password: hashedPassword,
    };
    mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

    const userDto: UserDto = {
      email: 'test@test.com',
      password: '123456',
    };
    await expect(service.login(userDto, req)).resolves.toBeDefined();
    await expect(service.login(userDto, req)).resolves.toHaveProperty('token');
    await expect(service.login(userDto, req)).resolves.toHaveProperty(
      'refresh_token',
    );
    await expect(service.login(userDto, req)).resolves.toHaveProperty('user');
  });
});
