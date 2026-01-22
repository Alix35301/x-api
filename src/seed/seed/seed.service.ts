// src/seed/seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Expense } from '../../expense/entities/expense.entity';
import { DatabaseService } from '../../database/database.service';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private dbService: DatabaseService
  ) { }

  async run() {
    // Clear existing data
    await this.dbService.truncateAllTables();

    // Seed new data
    const users: Partial<User>[] = [
      { name: 'Ali', email: 'alix35301@gmail.com', password: await bcrypt.hash('password', 10) },
      { name: 'JaneDoe', email: 'jane.doe@example.com', password: await bcrypt.hash('password', 10) },
    ];

    const userAdded = await this.userRepository.save(users);

    const categories: Partial<Category>[] = [
      { name: 'Food', description: 'Its food category' },
    ];

    await this.categoryRepository.save(categories);

    const expenses: Partial<Expense>[] = [];
    for (let i = 0; i < 100; i++) {
      expenses.push({
        name: faker.word.sample(),
        description: faker.word.words(10),
        amount: faker.helpers.arrayElement([10, 100, 50, 40, 20, 30]),
        is_approved: true,
        category_id: faker.helpers.arrayElement(categories).id.toString(),
        date: new Date(),
        user_id: userAdded[0].id.toString()
      })
    }
    await this.expenseRepository.save(expenses);
  }
}
