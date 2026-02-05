import { IsString, IsNumber, IsObject, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnFilterDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  include?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclude?: string[];
}

export class ColumnMappingsDto {
  @IsNumber()
  date: number;

  @IsNumber()
  description: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  type?: number;
}

export class AmountFormatDto {
  @IsString()
  negativePattern: string; // "-" or "()"

  @IsOptional()
  @IsString()
  creditIndicator?: string; // "CR" or other indicator
}

export class CsvConfigDto {
  @IsString()
  delimiter: string; // ",", ";", "\t"

  @IsNumber()
  skipRows: number;

  @ValidateNested()
  @Type(() => ColumnMappingsDto)
  columnMappings: ColumnMappingsDto;

  @IsString()
  dateFormat: string; // "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"

  @IsOptional()
  @ValidateNested()
  @Type(() => AmountFormatDto)
  amountFormat?: AmountFormatDto;

  @IsOptional()
  @IsObject()
  filters?: Record<string, ColumnFilterDto>;
}
