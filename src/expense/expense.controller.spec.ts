import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { Expense } from './entities/expense.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthGuard } from '../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('ExpenseController', () => {
  let controller: ExpenseController;
  let repo: Repository<Expense>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [ExpenseService,
        {
          provide: getRepositoryToken(Expense),
          useClass: Repository,
        },
        {
          provide: AuthGuard,
          useClass: AuthGuard
        },
        {
          provide: JwtService,
          useClass: JwtService
        }
      ],
    }).compile();

    controller = module.get<ExpenseController>(ExpenseController);
    repo = module.get<Repository<Expense>>(getRepositoryToken(Expense));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

});
