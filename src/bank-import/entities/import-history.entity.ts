import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { BankAccount } from './bank-account.entity';

export enum ImportStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

@Entity('import_history')
@Index(['user_id'])
@Index(['account_id'])
@Index(['file_hash'])
export class ImportHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  user_id: string;

  @Column({ type: 'int' })
  account_id: number;

  @ManyToOne(() => BankAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: BankAccount;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  file_hash: string;

  @Column({ type: 'int', default: 0 })
  total_rows: number;

  @Column({ type: 'int', default: 0 })
  imported_count: number;

  @Column({ type: 'int', default: 0 })
  duplicate_count: number;

  @Column({ type: 'int', default: 0 })
  error_count: number;

  @Column({
    type: 'enum',
    enum: ImportStatus,
    default: ImportStatus.SUCCESS,
  })
  status: ImportStatus;

  @Column({ type: 'json', nullable: true })
  error_details: any;

  @CreateDateColumn()
  created_at: Date;
}
