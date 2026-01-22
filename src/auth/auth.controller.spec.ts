import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DeviceServiceService } from '../device-service/device-service.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshTokens } from '../users/entities/refresh_tokens.entity';
import { Request, Response } from 'express';
import { UserDto } from './dto/user.dto';
describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let deviceService: DeviceServiceService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
  };

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      user: {},
      token: 'token',
      refresh_token: 'refresh_token',
    }),
  };

  const mockDeviceService = {
    parse: jest.fn(),
  };

  const req = {} as Request;
  const res = {} as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DeviceServiceService,
          useValue: mockDeviceService,
        },
        {
          provide: getRepositoryToken(RefreshTokens),
          useClass: Repository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    deviceService = module.get<DeviceServiceService>(DeviceServiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
    expect(deviceService).toBeDefined();
  });

  it('should login', async () => {
    const userDto: UserDto = {
      email: 'test@test.com',
      password: '123456',
    };
    const result = await controller.login(userDto, req, res);
    expect(result).toBeDefined();
  });
});
