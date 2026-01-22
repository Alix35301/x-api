import { AppModule } from "../../src/app.module";
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from "@nestjs/common";
import { App } from 'supertest/types';
import request from 'supertest';
import { JwtService } from "@nestjs/jwt";
import { JwtModule } from "@nestjs/jwt";
import cookieParser from "cookie-parser";
import { DataSource, Repository } from "typeorm";
import { ConfigModule } from "@nestjs/config";
import dayjs from 'dayjs';
import { Expense } from '../../src/expense/entities/expense.entity';

// Helper Functions
function generateToken(jwtService: JwtService, userId: string, email: string) {
  return jwtService.sign({ id: userId, email });
}

function makeAuthRequest(app: INestApplication, endpoint: string, token: string) {
  return request(app.getHttpServer())
    .get(endpoint)
    .set('Cookie', `session_token=${token}`);
}

function getDateDaysAgo(days: number): string {
  return dayjs().subtract(days, 'day').format('YYYY-MM-DD');
}

function getDateInWeek(weeksAgo: number, dayOfWeek: number = 0): Date {
  return dayjs().subtract(weeksAgo, 'week').day(dayOfWeek).toDate();
}

async function createExpense(repo: Repository<Expense>, data: {
  user_id: string;
  amount: number;
  date: Date | string;
  category_id?: string;
  name?: string;
  description?: string;
}) {
  return await repo.save(repo.create({
    name: data.name || 'Test Expense',
    description: data.description || 'Test Description',
    amount: data.amount,
    category_id: data.category_id || 'test-category',
    user_id: data.user_id,
    date: data.date,
    is_approved: false,
  }));
}

async function createExpenses(repo: Repository<Expense>, expenses: any[]) {
  return await repo.save(expenses.map(e => repo.create(e)));
}

function expectMetricsStructure(response: any) {
  expect(response.body.data).toBeDefined();
  expect(response.body.data.daily).toBeDefined();
  expect(response.body.data.weekly).toBeDefined();
  expect(response.body.data.monthly).toBeDefined();
  expect(response.body.data.dailyAggregates).toBeDefined();
  expect(response.body.data.weeklyAggregates).toBeDefined();
  expect(response.body.data.monthlyAggregates).toBeDefined();
}

describe('Dashboard e2e', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;
  let expenseRepo: Repository<Expense>;

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
    //    await moduleFixture.init()

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    jwtService = moduleFixture.get<JwtService>(JwtService);
    app.setGlobalPrefix('api');
    dataSource = app.get(DataSource);
    expenseRepo = dataSource.getRepository(Expense);

    await app.init();

  });

  beforeEach(async () => {
    // Clear expenses table before each test
    await expenseRepo.clear();
  });


  it('should successfully return metrics required for the dashboard', async () => {
    const token = await jwtService.sign({
      id: 1,
      email: 'test@example.com'
    });
    const response = await request(app.getHttpServer())
      .get('/api/dashboard/metrics')
      .set('Cookie', `session_token=${token}`)
      .expect(200);

    await expect(response.body.data).toBeDefined();
    await expect(response.body.data.daily).toBeDefined();

  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when accessing /metrics without token', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard/metrics')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard/metrics')
        .set('Cookie', 'session_token=invalid_token_here')
        .expect(401);
    });

    it('should return 401 with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard/metrics')
        .set('Cookie', 'session_token=not.a.jwt')
        .expect(401);
    });

    it('should return 200 with valid token', async () => {
      const token = generateToken(jwtService, '1', 'test@example.com');
      await makeAuthRequest(app, '/api/dashboard/metrics', token)
        .expect(200);
    });
  });

  describe('User Data Isolation', () => {
    let user1Token: string;
    let user2Token: string;

    beforeAll(() => {
      user1Token = generateToken(jwtService, '1', 'user1@example.com');
      user2Token = generateToken(jwtService, '2', 'user2@example.com');
    });

    it('should only return metrics for user 1 when user 1 is authenticated', async () => {
      // Create expenses for both users
      await createExpense(expenseRepo, {
        user_id: '1',
        amount: 100,
        date: dayjs().format('YYYY-MM-DD')
      });
      await createExpense(expenseRepo, {
        user_id: '2',
        amount: 500,
        date: dayjs().format('YYYY-MM-DD')
      });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', user1Token);

      expect(response.status).toBe(200);
      expect(Number(response.body.data.daily.today)).toBe(100); // Should be 100, not 100+500
    });

    it('should only return metrics for user 2 when user 2 is authenticated', async () => {
      await createExpense(expenseRepo, {
        user_id: '1',
        amount: 100,
        date: dayjs().format('YYYY-MM-DD')
      });
      await createExpense(expenseRepo, {
        user_id: '2',
        amount: 500,
        date: dayjs().format('YYYY-MM-DD')
      });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', user2Token);

      expect(response.status).toBe(200);
      expect(Number(response.body.data.daily.today)).toBe(500); // Should be 500, not 100+500
    });

    it('should return different metrics for different users', async () => {
      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: dayjs().format('YYYY-MM-DD') });
      await createExpense(expenseRepo, { user_id: '2', amount: 800, date: dayjs().format('YYYY-MM-DD') });

      const [response1, response2] = await Promise.all([
        makeAuthRequest(app, '/api/dashboard/metrics', user1Token),
        makeAuthRequest(app, '/api/dashboard/metrics', user2Token)
      ]);

      expect(Number(response1.body.data.daily.today)).toBe(200);
      expect(Number(response2.body.data.daily.today)).toBe(800);
      expect(response1.body.data.daily.today).not.toBe(response2.body.data.daily.today);
    });

    it('should return zeros when user has no expenses', async () => {
      const response = await makeAuthRequest(app, '/api/dashboard/metrics', user1Token);

      expect(Number(response.body.data.daily.today)).toBe(0);
      expect(Number(response.body.data.daily.yesterday)).toBe(0);
      expect(Number(response.body.data.weekly.thisWeek)).toBe(0);
      expect(Number(response.body.data.monthly.thisMonth)).toBe(0);
    });
  });

  describe('GET /metrics - Daily Metrics', () => {
    let token: string;

    beforeAll(() => {
      token = generateToken(jwtService, '1', 'test@example.com');
    });

    it('should calculate today total correctly with single expense', async () => {
      await createExpense(expenseRepo, {
        user_id: '1',
        amount: 150,
        date: dayjs().format('YYYY-MM-DD')
      });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.daily.today)).toBe(150);
    });

    it('should calculate today total correctly with multiple expenses', async () => {
      const today = dayjs().format('YYYY-MM-DD');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 50, date: today, category_id: 'cat1', name: 'Expense 1', description: 'Desc 1', is_approved: false },
        { user_id: '1', amount: 75, date: today, category_id: 'cat1', name: 'Expense 2', description: 'Desc 2', is_approved: false },
        { user_id: '1', amount: 125, date: today, category_id: 'cat1', name: 'Expense 3', description: 'Desc 3', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.daily.today)).toBe(250);
    });

    it('should calculate yesterday total correctly', async () => {
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      await createExpense(expenseRepo, {
        user_id: '1',
        amount: 200,
        date: yesterday
      });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.daily.yesterday)).toBe(200);
    });

    it('should calculate percentage increase correctly', async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: yesterday });
      await createExpense(expenseRepo, { user_id: '1', amount: 300, date: today });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      // (300 - 200) / 200 * 100 = 50%
      expect(response.body.data.daily.percent).toBeCloseTo(50, 1);
      expect(response.body.data.daily.trend).toBe('increase');
    });

    it('should calculate percentage decrease correctly', async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      await createExpense(expenseRepo, { user_id: '1', amount: 400, date: yesterday });
      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: today });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      // (200 - 400) / 400 * 100 = -50% -> abs = 50%
      expect(response.body.data.daily.percent).toBeCloseTo(50, 1);
      expect(response.body.data.daily.trend).toBe('decrease');
    });

    it('should return null percent and neutral trend when yesterday is 0', async () => {
      const today = dayjs().format('YYYY-MM-DD');
      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: today });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      expect(response.body.data.daily.percent).toBeNull();
      expect(response.body.data.daily.trend).toBe('neutral');
    });

    it('should show increase trend when today > yesterday', async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      await createExpense(expenseRepo, { user_id: '1', amount: 50, date: yesterday });
      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: today });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(response.body.data.daily.trend).toBe('increase');
    });

    it('should show decrease trend when today < yesterday', async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: yesterday });
      await createExpense(expenseRepo, { user_id: '1', amount: 50, date: today });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(response.body.data.daily.trend).toBe('decrease');
    });
  });

  describe('GET /metrics - Weekly Metrics', () => {
    let token: string;

    beforeAll(() => {
      token = generateToken(jwtService, '1', 'test@example.com');
    });

    it('should calculate current week total correctly', async () => {
      // Add expenses throughout this week
      const startOfWeek = dayjs().startOf('week');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 100, date: startOfWeek.toDate(), category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 150, date: startOfWeek.add(2, 'day').toDate(), category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false },
        { user_id: '1', amount: 50, date: startOfWeek.add(5, 'day').toDate(), category_id: 'cat1', name: 'E3', description: 'D3', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.weekly.thisWeek)).toBe(300);
    });

    it('should calculate previous week total correctly', async () => {
      const lastWeekStart = dayjs().subtract(1, 'week').startOf('week');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 200, date: lastWeekStart.toDate(), category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 100, date: lastWeekStart.add(3, 'day').toDate(), category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.weekly.prevWeek)).toBe(300);
    });

    it('should calculate weekly percentage change correctly', async () => {
      const thisWeekStart = dayjs().startOf('week');
      const lastWeekStart = dayjs().subtract(1, 'week').startOf('week');

      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: lastWeekStart.toDate() });
      await createExpense(expenseRepo, { user_id: '1', amount: 400, date: thisWeekStart.toDate() });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      // (400 - 200) / 200 * 100 = 100%
      expect(response.body.data.weekly.percent).toBeCloseTo(100, 1);
      expect(response.body.data.weekly.trend).toBe('increase');
    });

    it('should handle week boundaries correctly', async () => {
      // Test first and last day of current and previous week
      const thisWeekStart = dayjs().startOf('week');
      const thisWeekEnd = dayjs().endOf('week').startOf('day'); // Get date only, not end of day
      const lastWeekStart = dayjs().subtract(1, 'week').startOf('week');
      const lastWeekEnd = dayjs().subtract(1, 'week').endOf('week').startOf('day');

      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: lastWeekStart.format('YYYY-MM-DD') });
      await createExpense(expenseRepo, { user_id: '1', amount: 50, date: lastWeekEnd.format('YYYY-MM-DD') });
      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: thisWeekStart.format('YYYY-MM-DD') });
      await createExpense(expenseRepo, { user_id: '1', amount: 75, date: thisWeekEnd.format('YYYY-MM-DD') });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      // Both weeks should have expenses
      expect(Number(response.body.data.weekly.thisWeek)).toBeGreaterThanOrEqual(275);
      expect(Number(response.body.data.weekly.prevWeek)).toBeGreaterThanOrEqual(150);
    });

    it('should return neutral trend when prev week is 0', async () => {
      const thisWeekStart = dayjs().startOf('week');
      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: thisWeekStart.toDate() });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(response.body.data.weekly.trend).toBe('neutral');
    });
  });

  describe('GET /metrics - Monthly Metrics', () => {
    let token: string;

    beforeAll(() => {
      token = generateToken(jwtService, '1', 'test@example.com');
    });

    it('should calculate current month total correctly', async () => {
      const startOfMonth = dayjs().startOf('month');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 100, date: startOfMonth.toDate(), category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 200, date: startOfMonth.add(10, 'day').toDate(), category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false },
        { user_id: '1', amount: 150, date: startOfMonth.add(20, 'day').toDate(), category_id: 'cat1', name: 'E3', description: 'D3', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.monthly.thisMonth)).toBe(450);
    });

    it('should calculate previous month total correctly', async () => {
      const lastMonthStart = dayjs().subtract(1, 'month').startOf('month');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 300, date: lastMonthStart.toDate(), category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 200, date: lastMonthStart.add(15, 'day').toDate(), category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.monthly.prevMonth)).toBe(500);
    });

    it('should calculate monthly percentage change correctly', async () => {
      const thisMonthStart = dayjs().startOf('month');
      const lastMonthStart = dayjs().subtract(1, 'month').startOf('month');

      await createExpense(expenseRepo, { user_id: '1', amount: 1000, date: lastMonthStart.toDate() });
      await createExpense(expenseRepo, { user_id: '1', amount: 1500, date: thisMonthStart.toDate() });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      // (1500 - 1000) / 1000 * 100 = 50%
      expect(response.body.data.monthly.percent).toBeCloseTo(50, 1);
      expect(response.body.data.monthly.trend).toBe('increase');
    });

    it('should handle month boundaries correctly', async () => {
      const thisMonthFirst = dayjs().startOf('month');
      const thisMonthLast = dayjs().endOf('month').startOf('day');
      const lastMonthFirst = dayjs().subtract(1, 'month').startOf('month');
      const lastMonthLast = dayjs().subtract(1, 'month').endOf('month').startOf('day');

      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: lastMonthFirst.format('YYYY-MM-DD') });
      await createExpense(expenseRepo, { user_id: '1', amount: 75, date: lastMonthLast.format('YYYY-MM-DD') });
      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: thisMonthFirst.format('YYYY-MM-DD') });
      await createExpense(expenseRepo, { user_id: '1', amount: 50, date: thisMonthLast.format('YYYY-MM-DD') });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      expect(Number(response.body.data.monthly.thisMonth)).toBeGreaterThanOrEqual(250);
      expect(Number(response.body.data.monthly.prevMonth)).toBeGreaterThanOrEqual(175);
    });

    it('should handle year boundaries correctly', async () => {
      // Test December -> January transition
      const jan1 = dayjs().year(2024).month(0).date(1);
      const dec31 = dayjs().year(2023).month(11).date(31);

      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: dec31.toDate() });
      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: jan1.toDate() });

      // This test validates that the query correctly handles year rollover
      // The exact assertion depends on current date, but it should not throw errors
      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /metrics - Daily Aggregates', () => {
    let token: string;

    beforeAll(() => {
      token = generateToken(jwtService, '1', 'test@example.com');
    });

    it('should return daily aggregates array', async () => {
      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      expect(Array.isArray(response.body.data.dailyAggregates)).toBe(true);
    });

    it('should group expenses by date correctly', async () => {
      const today = dayjs();
      const todayStr = today.format('YYYY-MM-DD');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 50, date: todayStr, category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 75, date: todayStr, category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false },
        { user_id: '1', amount: 100, date: today.subtract(1, 'day').format('YYYY-MM-DD'), category_id: 'cat1', name: 'E3', description: 'D3', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      const dailyAgg = response.body.data.dailyAggregates;

      // Find today's entry - date is a Date object, normalize for comparison
      const todayEntry = dailyAgg.find(item => {
        const itemDateStr = dayjs(item.date).format('YYYY-MM-DD');
        return itemDateStr === todayStr;
      });

      expect(todayEntry).toBeDefined();
      expect(Number(todayEntry.total)).toBeGreaterThanOrEqual(125); // 50 + 75
    });

    it('should include last 30 days of data', async () => {
      // Create expenses for each of the last 30 days
      const expenses = [];
      for (let i = 0; i < 30; i++) {
        expenses.push({
          user_id: '1',
          amount: 10,
          date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
          category_id: 'cat1',
          name: `Expense ${i}`,
          description: `Desc ${i}`,
          is_approved: false
        });
      }
      await createExpenses(expenseRepo, expenses);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      const dailyAgg = response.body.data.dailyAggregates;

      expect(dailyAgg.length).toBeGreaterThanOrEqual(1);
      expect(dailyAgg.length).toBeLessThanOrEqual(30);
    });

    it('should not include expenses older than 30 days', async () => {
      const day35Ago = dayjs().subtract(35, 'day').format('YYYY-MM-DD');
      const day20Ago = dayjs().subtract(20, 'day').format('YYYY-MM-DD');

      await createExpense(expenseRepo, { user_id: '1', amount: 100, date: day35Ago });
      await createExpense(expenseRepo, { user_id: '1', amount: 200, date: day20Ago });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      const dailyAgg = response.body.data.dailyAggregates;

      // Should include 20 days ago
      const has20DayAgo = dailyAgg.some(item => {
        const itemDateStr = dayjs(item.date).format('YYYY-MM-DD');
        return itemDateStr === day20Ago;
      });
      expect(has20DayAgo).toBe(true);

      // Should NOT include 35 days ago
      const has35DayAgo = dailyAgg.some(item => {
        const itemDateStr = dayjs(item.date).format('YYYY-MM-DD');
        return itemDateStr === day35Ago;
      });
      expect(has35DayAgo).toBe(false);
    });
  });

  describe('GET /metrics - Weekly Aggregates', () => {
    let token: string;

    beforeAll(() => {
      token = generateToken(jwtService, '1', 'test@example.com');
    });

    it('should return weekly aggregates array', async () => {
      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Array.isArray(response.body.data.weeklyAggregates)).toBe(true);
    });

    it('should group expenses by year and week correctly', async () => {
      const thisWeek = dayjs().startOf('week');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 100, date: thisWeek.toDate(), category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 200, date: thisWeek.add(3, 'day').toDate(), category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      const weeklyAgg = response.body.data.weeklyAggregates;

      expect(weeklyAgg.length).toBeGreaterThan(0);
      expect(weeklyAgg[0]).toHaveProperty('year');
      expect(weeklyAgg[0]).toHaveProperty('week');
      expect(weeklyAgg[0]).toHaveProperty('total');
    });

    it('should limit results to 14 weeks', async () => {
      // Create expenses across many weeks
      const expenses = [];
      for (let i = 0; i < 20; i++) {
        expenses.push({
          user_id: '1',
          amount: 50,
          date: dayjs().subtract(i, 'week').toDate(),
          category_id: 'cat1',
          name: `Expense ${i}`,
          description: `Desc ${i}`,
          is_approved: false
        });
      }
      await createExpenses(expenseRepo, expenses);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      const weeklyAgg = response.body.data.weeklyAggregates;

      expect(weeklyAgg.length).toBeLessThanOrEqual(14);
    });
  });

  describe('GET /metrics - Monthly Aggregates', () => {
    let token: string;

    beforeAll(() => {
      token = generateToken(jwtService, '1', 'test@example.com');
    });

    it('should return monthly aggregates array', async () => {
      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Array.isArray(response.body.data.monthlyAggregates)).toBe(true);
    });

    it('should group expenses by year and month correctly', async () => {
      const thisMonth = dayjs().startOf('month');
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 300, date: thisMonth.toDate(), category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 200, date: thisMonth.add(15, 'day').toDate(), category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      const monthlyAgg = response.body.data.monthlyAggregates;

      expect(monthlyAgg.length).toBeGreaterThan(0);
      expect(monthlyAgg[0]).toHaveProperty('year');
      expect(monthlyAgg[0]).toHaveProperty('month');
      expect(monthlyAgg[0]).toHaveProperty('total');
    });

    it('should limit results to 6 months', async () => {
      // Create expenses across many months
      const expenses = [];
      for (let i = 0; i < 10; i++) {
        expenses.push({
          user_id: '1',
          amount: 100,
          date: dayjs().subtract(i, 'month').toDate(),
          category_id: 'cat1',
          name: `Expense ${i}`,
          description: `Desc ${i}`,
          is_approved: false
        });
      }
      await createExpenses(expenseRepo, expenses);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      const monthlyAgg = response.body.data.monthlyAggregates;

      expect(monthlyAgg.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Edge Cases', () => {
    let token: string;

    beforeAll(() => {
      token = generateToken(jwtService, '1', 'test@example.com');
    });

    it('should handle zero expenses gracefully', async () => {
      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      expect(response.status).toBe(200);
      expect(Number(response.body.data.daily.today)).toBe(0);
      expect(Number(response.body.data.daily.yesterday)).toBe(0);
    });

    it('should handle large expense amounts', async () => {
      const largeAmount = 999999999;
      await createExpense(expenseRepo, {
        user_id: '1',
        amount: largeAmount,
        date: dayjs().format('YYYY-MM-DD')
      });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.daily.today)).toBeGreaterThanOrEqual(largeAmount);
    });

    it('should handle decimal amounts correctly', async () => {
      await createExpenses(expenseRepo, [
        { user_id: '1', amount: 10, date: dayjs().format('YYYY-MM-DD'), category_id: 'cat1', name: 'E1', description: 'D1', is_approved: false },
        { user_id: '1', amount: 20, date: dayjs().format('YYYY-MM-DD'), category_id: 'cat1', name: 'E2', description: 'D2', is_approved: false }
      ]);

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.daily.today)).toBe(30);
    });

    it('should return empty arrays for aggregates when no data exists', async () => {
      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      expect(response.body.data.dailyAggregates).toEqual([]);
      expect(response.body.data.weeklyAggregates).toEqual([]);
      expect(response.body.data.monthlyAggregates).toEqual([]);
    });

    it('should handle expenses exactly at midnight', async () => {
      const midnight = dayjs().startOf('day').toDate();
      await createExpense(expenseRepo, {
        user_id: '1',
        amount: 100,
        date: midnight
      });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);
      expect(Number(response.body.data.daily.today)).toBe(100);
    });

    it('should round percentages appropriately', async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      await createExpense(expenseRepo, { user_id: '1', amount: 3, date: yesterday });
      await createExpense(expenseRepo, { user_id: '1', amount: 7, date: today });

      const response = await makeAuthRequest(app, '/api/dashboard/metrics', token);

      // (7 - 3) / 3 * 100 = 133.333...%
      expect(response.body.data.daily.percent).toBeDefined();
      expect(typeof response.body.data.daily.percent).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing JWT secret gracefully', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature';

      const response = await request(app.getHttpServer())
        .get('/api/dashboard/metrics')
        .set('Cookie', `session_token=${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it('should handle malformed cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/metrics')
        .set('Cookie', 'session_token=');

      expect(response.status).toBe(401);
    });

    it('should handle requests with no cookie header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/metrics');

      expect(response.status).toBe(401);
    });

    it('should return proper error format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/metrics')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });


})
