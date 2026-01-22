import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardQueryService } from './query.service';
import { Expense } from '../expense/entities/expense.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/auth/auth.module';

@Module({
  controllers: [DashboardController],
  providers: [DashboardQueryService, DashboardService],
  imports: [TypeOrmModule.forFeature([Expense]), AuthModule],
})
export class DashboardModule { }
