import { Type } from "class-transformer";
import { IsDateString, IsIn, IsOptional, IsPositive, Min } from "class-validator";

export class FilterDTO {
    @IsOptional()
    @IsDateString()
    start_date?: string

    @IsOptional()
    @IsDateString()
    end_date?: string

    @IsOptional()
    search?: string

    @IsOptional()
    category_id?: string

    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsIn(['date', 'amount', 'description'])
    sort_by?: string = 'date';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sort_order?: 'ASC' | 'DESC' = 'DESC';
}
