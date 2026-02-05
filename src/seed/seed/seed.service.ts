import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { DatabaseService } from '../../database/database.service';
import bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private dbService: DatabaseService,
  ) {}

  async run() {
    await this.dbService.truncateAllTables();

    const hashedPassword = await bcrypt.hash('password', 10);
    await this.userRepository.save([
      { name: 'Ali', email: 'alix35301@gmail.com', password: hashedPassword },
    ]);

    await this.categoryRepository.save([
      { name: 'Food', description: 'Restaurants, groceries & takeout' },
      { name: 'Transport', description: 'Fuel, rides & public transit' },
      { name: 'Entertainment', description: 'Movies, games & subscriptions' },
      { name: 'Shopping', description: 'Clothing, electronics & general' },
      { name: 'Bills', description: 'Utilities, rent & recurring payments' },
      { name: 'Health', description: 'Pharmacy, gym & medical' },
    ]);
  }
}
