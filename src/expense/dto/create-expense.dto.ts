import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  amount: number

  @IsString()
  @IsNotEmpty()
  category_id: string;

  @IsOptional()
  @IsDateString()
  date?: string;

}
