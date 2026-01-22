import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { ExpenseService } from './expense.service';
import { Expense } from './entities/expense.entity';
import { FilterDTO } from './dto/filter.dto';
import { NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let repo: Repository<Expense>;
  let mockedQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[{}, {}], 10]),
    orWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
  };
  let mockedRepo = {
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    findOneOrFail: jest.fn(),
    softRemove: jest.fn()
  };

  mockedRepo.createQueryBuilder.mockReturnValue(mockedQueryBuilder);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockedRepo,
        },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
    repo = module.get<Repository<Expense>>(getRepositoryToken(Expense));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully create an expense', async () => {
    const expData: Partial<Expense> = {
      amount: 100,
      name: 'Test',
      description: 'test',
      category_id: 'category-123',
      user_id: 'user-123',
    };

    mockedRepo.save.mockResolvedValue(expData);
    const saved = await service.create('user-123', {
      amount: 100,
      name: 'Test',
      description: 'test',
      category_id: 'category-123',
    });

    expect(mockedRepo.save).toHaveBeenCalledTimes(1);
    expect(mockedRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
        name: 'Test',
        description: 'test',
        category_id: 'category-123',
        user_id: 'user-123',
        date: expect.any(Date),
      })
    );
    expect(expData).toEqual(saved);
  });

  it('should call querybuilders where method with correct filter params', async () => {
    const filter: Partial<FilterDTO> & { end_dates: string } = {
      start_date: '2025-01-01',
      end_dates: '2025-01-01', // incorrect filter label
      end_date: '2025-01-01',
      category_id: 'category-123',
      search: 'test',
    };

    const pagination = {
      page: 1,
      limit: 10,
    };
    const all = await service.findAll('user-123', filter as FilterDTO, pagination);
    expect(mockedRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mockedRepo.createQueryBuilder).toHaveBeenCalledWith('expense');

    // Should filter by user
    expect(mockedQueryBuilder.andWhere).toHaveBeenCalledWith(
      'expense.user_id = :userId',
      { userId: 'user-123' },
    );

    if (filter.start_date) {
      expect(mockedQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('start_date'),
        { start_date: '2025-01-01' },
      );
    }

    if (filter.end_date) {
      expect(mockedQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('end_date'),
        { end_date: '2025-01-01' },
      );
    }

    if (filter.category_id) {
      expect(mockedQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('category_id'),
        { category_id: 'category-123' },
      );
    }

    if (filter.search) {
      expect(mockedQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('search'),
        { search: '%test%' },
      );
    }
    // Should apply pagination
    expect(mockedQueryBuilder.skip).toHaveBeenCalledWith(0);
    expect(mockedQueryBuilder.take).toHaveBeenCalledWith(10);

    expect(mockedQueryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
    await expect(mockedQueryBuilder.getManyAndCount()).resolves.toEqual([
      [{}, {}],
      10,
    ]);
    expect(all.meta.totalPages).toBe(1);
    expect(all.data.length).toBe(2);
  });

  it('should reject with 404 not found error when expense doesnt exist in database', async () => {
    mockedRepo.findOneOrFail.mockRejectedValue(new EntityNotFoundError('Expense', 1));
    await expect(service.update('user-123', 1, {
      amount: 100,
      name: 'Test',
      description: 'test',
    })).rejects.toThrow(NotFoundException);

    expect(mockedRepo.findOneOrFail).toHaveBeenCalledTimes(1);
    expect(mockedRepo.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 1, user_id: 'user-123' },
    });
  });

  it('should soft delete expense', async () => {
    const mockedExpense: Expense = {
      id: 1,
      amount: 100,
      description: 'test',
      name:'name',
      is_approved: true,
      category_id: 'category-123',
      user_id: 'user-123',
      date: new Date(),
    }

    const mockReturnedExpense: Expense = {
      ...mockedExpense,
      deleted_at: new Date()
    }
    mockedRepo.softRemove.mockResolvedValue(mockReturnedExpense);

    mockedRepo.findOneOrFail.mockResolvedValue(mockedExpense);
    await expect(service.remove('user-123', 1)).resolves.toBe(mockReturnedExpense);
    expect(mockedRepo.softRemove).toHaveBeenCalledTimes(1);
    expect(mockedRepo.softRemove).toHaveBeenCalledWith(mockedExpense);
    expect(mockedRepo.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 1, user_id: 'user-123' },
    });
  })

  it('should bulk insert expenses', async () => {
    const expenses: Partial<Expense>[] = [
      {
        amount: 100,
        name: 'Test',
        description: 'test',
        category_id: 'category-123',
        user_id: 'user-123',
      },
      {
        amount: 200,
        name: 'Test2',
        description: 'test2',
        category_id: 'category-123',
        user_id: 'user-123',
      }
    ];
    mockedRepo.save.mockResolvedValue(expenses);
    await expect(service.bulkInsert('user-123', expenses as CreateExpenseDto[])).resolves.toBe(expenses);
    expect(mockedRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 100,
          name: 'Test',
          description: 'test',
          category_id: 'category-123',
          user_id: 'user-123',
          date: expect.any(Date),
        }),
        expect.objectContaining({
          amount: 200,
          name: 'Test2',
          description: 'test2',
          category_id: 'category-123',
          user_id: 'user-123',
          date: expect.any(Date),
        })
      ])
    );
  });


});
