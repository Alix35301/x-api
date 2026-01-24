import { IsNumber } from 'class-validator';

export class UploadStatementDto {
  @IsNumber()
  accountId: number;
}
