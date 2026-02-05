import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { BankImportService } from './bank-import.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateCategoryRuleDto, UpdateCategoryRuleDto } from './dto/create-category-rule.dto';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../users/entities/user.entity';
import { ACCOUNT_TYPES } from '../config/account-types.config';

@Controller('bank-import')
export class BankImportController {
  constructor(private readonly bankImportService: BankImportService) {}

  // ==================== Config (Public) ====================

  @Get('config/account-types')
  getAccountTypes() {
    return ACCOUNT_TYPES;
  }

  // ==================== Statement Upload ====================

  @Post('statement')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadStatement(
    @Req() req: Request & { user: Partial<User> },
    @UploadedFile() file: Express.Multer.File,
    @Body('accountId') accountId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!accountId) {
      throw new BadRequestException('accountId is required');
    }

    const userId = req.user.id.toString();
    const accountIdNum = parseInt(accountId, 10);

    if (isNaN(accountIdNum)) {
      throw new BadRequestException('accountId must be a valid number');
    }

    return await this.bankImportService.importStatement(
      userId,
      accountIdNum,
      file.buffer,
      file.originalname,
    );
  }

  // ==================== Bank Account Management ====================

  @Post('accounts')
  @UseGuards(AuthGuard)
  async createAccount(
    @Req() req: Request & { user: Partial<User> },
    @Body() createBankAccountDto: CreateBankAccountDto,
  ) {
    return await this.bankImportService.createBankAccount(
      req.user.id.toString(),
      createBankAccountDto,
    );
  }

  @Get('accounts')
  @UseGuards(AuthGuard)
  async findAllAccounts(@Req() req: Request & { user: Partial<User> }) {
    return await this.bankImportService.findAllBankAccounts(req.user.id.toString());
  }

  @Get('accounts/:id')
  @UseGuards(AuthGuard)
  async findOneAccount(
    @Req() req: Request & { user: Partial<User> },
    @Param('id') id: string,
  ) {
    return await this.bankImportService.findOneBankAccount(req.user.id.toString(), +id);
  }

  @Patch('accounts/:id')
  @UseGuards(AuthGuard)
  async updateAccount(
    @Req() req: Request & { user: Partial<User> },
    @Param('id') id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return await this.bankImportService.updateBankAccount(
      req.user.id.toString(),
      +id,
      updateBankAccountDto,
    );
  }

  @Delete('accounts/:id')
  @UseGuards(AuthGuard)
  async deleteAccount(
    @Req() req: Request & { user: Partial<User> },
    @Param('id') id: string,
  ) {
    await this.bankImportService.deleteBankAccount(req.user.id.toString(), +id);
    return { message: 'Bank account deleted successfully' };
  }

  // ==================== Category Rules Management ====================

  @Post('category-rules')
  @UseGuards(AuthGuard)
  async createCategoryRule(
    @Req() req: Request & { user: Partial<User> },
    @Body() createCategoryRuleDto: CreateCategoryRuleDto,
  ) {
    return await this.bankImportService.createCategoryRule(
      req.user.id.toString(),
      createCategoryRuleDto,
    );
  }

  @Get('category-rules')
  @UseGuards(AuthGuard)
  async findAllCategoryRules(@Req() req: Request & { user: Partial<User> }) {
    return await this.bankImportService.findAllCategoryRules(req.user.id.toString());
  }

  @Get('category-rules/:id')
  @UseGuards(AuthGuard)
  async findOneCategoryRule(
    @Req() req: Request & { user: Partial<User> },
    @Param('id') id: string,
  ) {
    return await this.bankImportService.findOneCategoryRule(req.user.id.toString(), +id);
  }

  @Patch('category-rules/:id')
  @UseGuards(AuthGuard)
  async updateCategoryRule(
    @Req() req: Request & { user: Partial<User> },
    @Param('id') id: string,
    @Body() updateCategoryRuleDto: UpdateCategoryRuleDto,
  ) {
    return await this.bankImportService.updateCategoryRule(
      req.user.id.toString(),
      +id,
      updateCategoryRuleDto,
    );
  }

  @Delete('category-rules/:id')
  @UseGuards(AuthGuard)
  async deleteCategoryRule(
    @Req() req: Request & { user: Partial<User> },
    @Param('id') id: string,
  ) {
    await this.bankImportService.deleteCategoryRule(req.user.id.toString(), +id);
    return { message: 'Category rule deleted successfully' };
  }

  // ==================== Import History ====================

  @Get('history')
  @UseGuards(AuthGuard)
  async findAllImports(@Req() req: Request & { user: Partial<User> }) {
    return await this.bankImportService.findAllImports(req.user.id.toString());
  }

  @Get('history/:id')
  @UseGuards(AuthGuard)
  async findOneImport(
    @Req() req: Request & { user: Partial<User> },
    @Param('id') id: string,
  ) {
    return await this.bankImportService.findOneImport(req.user.id.toString(), +id);
  }
}
