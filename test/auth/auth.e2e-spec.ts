import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { UsersService } from '../../src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RefreshTokens } from '../../src/users/entities/refresh_tokens.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { resetDatabase } from '../helpers/database';
import { DataSource } from 'typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../src/auth/auth.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UsersService;
  let mockRefreshTokenRepo: any;
  let testUserId: number;
  let dataSource: DataSource;

  beforeAll(async () => {
    mockRefreshTokenRepo = {
      findOneBy: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule, JwtModule, AuthModule],
    })
      .overrideProvider(getRepositoryToken(RefreshTokens))
      .useValue(mockRefreshTokenRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    userService = moduleFixture.get<UsersService>(UsersService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
    const user = await userService.create({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    });
    testUserId = user.id;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // await resetDatabase(dataSource);

    // Recreate test user for next test
    const user = await userService.create({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (app) {
      // await resetDatabase(dataSource);
      await app.close();
    }
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should return access_token, refresh_token on valid login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .set('User-Agent', 'Test User Agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .expect(200)
      .expect((res) => {
        expect(res.body.token).toBeTruthy();
        expect(res.body.refresh_token).toBeTruthy();
        expect(res.body.user).toBeTruthy();
      });
  });

  it('should should fail with invalid credential', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })
      .set('User-Agent', 'Test User Agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .expect(401);
  });

  it('should return new access_token on valid refresh token', () => {
    mockRefreshTokenRepo.findOneBy.mockResolvedValue({
      id: 1,
      user_id: testUserId,
      token_hash: 'refresh_token',
      device_name: 'Test Device',
      ip_address: '127.0.0.1',
      user_agent: 'Test User Agent',
      last_used_at: null,
      expires_at: new Date(Date.now() + 86400000),
    });

    mockRefreshTokenRepo.update.mockResolvedValue({ affected: 1 });

    return request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ token: 'refresh_token' })
      .expect(200)
      .expect((res) => {
        expect(res.body.token).toBeTruthy();
      });
  });
});
