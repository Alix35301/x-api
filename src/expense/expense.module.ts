import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { Expense } from './entities/expense.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense]), AuthModule],
  controllers: [ExpenseController],
  providers: [ExpenseService]
})
export class ExpenseModule {}
