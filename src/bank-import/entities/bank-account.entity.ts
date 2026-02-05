import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { CsvConfigDto } from '../dto/csv-config.dto';

export enum AccountType {
  SAVING = 'SAVING',
  CURRENT = 'CURRENT',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}

@Entity('bank_accounts')
@Index(['user_id'])
export class BankAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  bank_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  account_name: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  account_number_last4: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.OTHER,
  })
  account_type: AccountType;

  @Column({ type: 'json' })
  csv_config: CsvConfigDto;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
