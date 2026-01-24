import { IsString, IsEnum, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CsvConfigDto } from './csv-config.dto';

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}

export class CreateBankAccountDto {
  @IsString()
  bankName: string;

  @IsOptional()
  @IsString()
  accountName?: string; // e.g., "Personal Checking"

  @IsOptional()
  @IsString()
  accountNumberLast4?: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @ValidateNested()
  @Type(() => CsvConfigDto)
  csvConfig: CsvConfigDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  accountNumberLast4?: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CsvConfigDto)
  csvConfig?: CsvConfigDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
