import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../../src/auth/auth.guard';
import { User } from '../../src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense } from '../../src/expense/entities/expense.entity';
import { Repository } from 'typeorm';
import { DashboardQueryService } from './query.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService,
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
    private queryService: DashboardQueryService
  ) { }

  @UseGuards(AuthGuard)
  @Get('metrics')
  async getMetrics(@Req() req: Request & { user: Partial<User> }) {
    console.log(await this.dashboardService.getMetrics(req.user.id.toString())
    )
    return {
      data: await this.dashboardService.getMetrics(req.user.id.toString())
    }
  }
}
