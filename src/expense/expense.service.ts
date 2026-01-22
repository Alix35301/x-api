import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { FilterDTO } from './dto/filter.dto';
import { PaginatedResult, PaginationDTO } from 'src/common/dto/pagination.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}
  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    return await this.expenseRepo.save({
      ...createExpenseDto,
      user_id: userId,
      date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
    });
  }

  async findAll(
    userId: string,
    filterDto?: FilterDTO,
    paginationDto?: PaginationDTO,
  ): Promise<PaginatedResult<Expense>> {
    const query = this.expenseRepo.createQueryBuilder('expense');

    // Filter by user
    query.andWhere('expense.user_id = :userId', { userId });

    if (filterDto && filterDto.start_date) {
      query.andWhere('expense.date >= :start_date', {
        start_date: filterDto.start_date,
      });
    }
    if (filterDto && filterDto.end_date) {
      query.andWhere('expense.date <= :end_date', {
        end_date: filterDto.end_date,
      });
    }
    if (filterDto && filterDto.category_id) {
      query.andWhere('expense.category_id = :category_id', {
        category_id: filterDto.category_id,
      });
    }

    if (filterDto && filterDto.search) {
      query.andWhere('(expense.name LIKE :search OR expense.description LIKE :search OR expense.amount LIKE :search)', {
        search: `%${filterDto.search}%`,
      });
    }

    // Apply pagination
    const skip = (paginationDto.page - 1) * paginationDto.limit;
    query.skip(skip).take(paginationDto.limit);

    const [expenses, total] = await query.getManyAndCount();
    return {
      data: expenses,
      meta: {
        page: paginationDto.page,
        limit: paginationDto.limit,
        total: total,
        totalPages: Math.ceil(total / paginationDto.limit),
      },
    };
  }

  async findOne(userId: string, id: number) {
    try {
      return await this.expenseRepo.findOneOrFail({
        where: { id, user_id: userId },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(`Expense with ID ${id} not found`);
      }
      throw error;
    }
  }

  async update(userId: string, id: number, updateExpenseDto: UpdateExpenseDto) {
    try {
      const expense = await this.expenseRepo.findOneOrFail({
        where: { id, user_id: userId },
      });
      this.expenseRepo.merge(expense, updateExpenseDto);
      return await this.expenseRepo.save(expense);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(`Expense with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(userId: string, id: number) {
    try {
      const expense = await this.expenseRepo.findOneOrFail({
        where: { id, user_id: userId },
      });
      return await this.expenseRepo.softRemove(expense);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(`Expense with ID ${id} not found`);
      }
      throw error;
    }
  }

  async bulkInsert(userId: string, createExpenseDto: CreateExpenseDto[]) {
    const expensesWithUserId = createExpenseDto.map(expense => ({
      ...expense,
      user_id: userId,
      date: expense.date ? new Date(expense.date) : new Date(),
    }));
    return await this.expenseRepo.save(expensesWithUserId);
  }
}
