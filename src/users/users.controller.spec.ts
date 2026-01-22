import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeviceServiceService } from '../device-service/device-service.service';
import { RefreshTokens } from './entities/refresh_tokens.entity';
import { ConfigService } from '@nestjs/config';

describe('UsersController', () => {
  let controller: UsersController;
  let repo: Repository<User>;
  const mockDeviceService = {
    parse: jest.fn()
  }
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'REFRESH_EXPIRES_IN') {
        return '7';
      }
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: DeviceServiceService,
          useValue: mockDeviceService
        },
        {
          provide: getRepositoryToken(RefreshTokens),
          useClass: Repository,
        },
        {
          provide: ConfigService,
          useValue: configService
        }
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(true).toBeDefined();
  });
});
