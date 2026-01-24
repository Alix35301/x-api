import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateCategoryRuleDto {
  @IsString()
  pattern: string; // Merchant name pattern

  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  priority?: number; // Higher = checked first

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryRuleDto {
  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
