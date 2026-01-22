import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { resetDatabase } from '../helpers/database';
import { DataSource } from 'typeorm';
import { CategoryService } from '../../src/category/category.service';
import { ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import { ConfigModule } from '@nestjs/config';

describe('CategoryController (e2e)', () => {
  let app: INestApplication<App>;
  let categoryService: CategoryService;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test'
        }),
        AppModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'secret',
          signOptions: {
            expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '15') * 60 * 1000,
          },
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    categoryService = moduleFixture.get<CategoryService>(CategoryService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
  });


  describe('POST /category', () => {
    it('should create a category with valid data', async () => {
      const token = jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      return request(app.getHttpServer())
        .post('/api/category')
        .send({ name: 'test', description: 'description' })
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(201);
    });
  });

  describe('GET /category', () => {
    it('should get all categories with valid data', async () => {
      const token = jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      await categoryService.create({ name: '1das', description: 'description' });

      const response = await request(app.getHttpServer())
        .get('/api/category')
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0); ``
    });
  });

  describe('DELETE /category/:id', () => {
    it('should delete a category with valid data', async () => {
      const token = jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      const category = await categoryService.create({ name: 'test', description: 'description' });
      await request(app.getHttpServer())
        .delete(`/api/category/${category.id}`)
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(204);
    });
  });

  describe('PATCH /category/:id', () => {
    it('should update a category with valid data', async () => {
      const token = jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      const category = await categoryService.create({ name: 'test', description: 'description' });
      await request(app.getHttpServer())
        .patch(`/api/category/${category.id}`)
        .send({ name: 'tsadsest', description: 'description' })
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(200);
    });
  });
});
