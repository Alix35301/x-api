import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { CategoryService } from '../../src/category/category.service';
import { ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ExpenseService } from '../../src/expense/expense.service';
import { CreateExpenseDto } from 'src/expense/dto/create-expense.dto';
import cookieParser from 'cookie-parser';

describe('ExpenseController (e2e)', () => {
  let app: INestApplication<App>;
  let categoryService: CategoryService;
  let expenseService: ExpenseService;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
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
    app.use(cookieParser());
    app.setGlobalPrefix('api');
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
    expenseService = moduleFixture.get<ExpenseService>(ExpenseService);
  });

  afterAll(async () => {
    if (app) {
      // await resetDatabase(dataSource);
      await app.close();
    }
  });

  describe('POST /expense', () => {
    it('should create a expense with valid data', async () => {
      const token = await jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      const response = await request(app.getHttpServer())
        .post('/api/expense')
        .send({ name: 'test', description: 'description', amount: 100, category_id: 'category-444' })
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(201);

      expect(response.body.id).toBeDefined();

    });

  });

  describe('PATCH /expense/:id', () => {
    it('should update a expense with valid data', async () => {
      const token = await jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      const expense = await expenseService.create('1', { name: 'test', description: 'description', amount: 100, category_id: 'category-444' });
      const response = await request(app.getHttpServer())
        .patch(`/api/expense/${expense.id}`)
        .send({ name: 'test', description: 'description', amount: 100, category_id: 'category-444' })
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(200);

      expect(response.body.id).toBeDefined();
    });
  });

  describe('DELETE /expense/:id', () => {
    it('should delete a expense with valid data', async () => {
      const token = await jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      const expense = await expenseService.create('1', { name: 'test', description: 'description', amount: 100, category_id: 'category-444' });
      const response = await request(app.getHttpServer())
        .delete(`/api/expense/${expense.id}`)
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(204);

      expect(response.status).toBe(204);
    });
  });

  describe('GET /expense/:id', () => {
    it('should get a expense with valid data', async () => {
      const token = await jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      const expense = await expenseService.create('1', { name: 'test', description: 'description', amount: 100, category_id: 'category-444' });
      const response = await request(app.getHttpServer())
        .get(`/api/expense`)
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.some(e => e.id === expense.id)).toBe(true);
    });
  });

  describe('POST /expense/bulk', () => {
    it('should bulk insert expenses with valid data', async () => {
      const expenses: CreateExpenseDto[] = [
        { name: 'test', description: 'description', amount: 100, category_id: 'category-444' },
        { name: 'test2', description: 'description2', amount: 200, category_id: 'category-444' }
      ];

      const token = await jwtService.sign({
        id: 1,
        email: 'test@example.com',
      });
      const response = await request(app.getHttpServer())
        .post('/api/expense/bulk')
        .send(expenses)
        .set('User-Agent', 'Test User Agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('Cookie', `session_token=${token}`)
        .expect(201);
      expect(response.body.length).toBe(2);
    });
  });
});
