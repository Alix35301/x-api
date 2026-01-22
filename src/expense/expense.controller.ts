import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  Req,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterDTO } from './dto/filter.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

@Controller('expense')
@UseGuards(AuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(@Req() req: Request & { user: Partial<User> }, @Body() createExpenseDto: CreateExpenseDto) {
    return await this.expenseService.create(req.user.id.toString(), createExpenseDto);
  }

  @Get()
  findAll(@Req() req: Request & { user: Partial<User> }, @Query() queryDto: FilterDTO) {
    return this.expenseService.findAll(req.user.id.toString(), queryDto, queryDto);
  }

  @Get(':id')
  findOne(@Req() req: Request & { user: Partial<User> }, @Param('id') id: string) {
    return this.expenseService.findOne(req.user.id.toString(), +id);
  }

  @Patch(':id')
  async update(@Req() req: Request & { user: Partial<User> }, @Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return await this.expenseService.update(req.user.id.toString(), +id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: Request & { user: Partial<User> }, @Param('id') id: string) {
    return this.expenseService.remove(req.user.id.toString(), +id);
  }

  @Post('bulk')
  async bulkInsert(@Req() req: Request & { user: Partial<User> }, @Body() createExpenseDto: CreateExpenseDto[]) {
    return await this.expenseService.bulkInsert(req.user.id.toString(), createExpenseDto);
  }
}
