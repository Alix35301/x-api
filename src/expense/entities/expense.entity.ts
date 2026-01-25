import { Column, Entity, PrimaryGeneratedColumn, DeleteDateColumn, Index } from 'typeorm';

export enum ExpenseSource {
  IMPORT = 'IMPORT',
  MANUAL = 'MANUAL',
}

@Entity('expenses')
@Index(['transaction_hash'])
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  amount: number;

  @Column()
  category_id: string;

  @Column()
  user_id: string;

  @Column()
  date: Date;

  @Column({ default: false })
  is_approved: boolean;

  @Column({
    type: 'enum',
    enum: ExpenseSource,
    default: ExpenseSource.MANUAL,
  })
  source: ExpenseSource;

  @Column({ type: 'int', nullable: true })
  import_id: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  transaction_hash: string;

  @Column({ type: 'text', nullable: true })
  raw_description: string;

  @DeleteDateColumn()
  deleted_at?: Date;
}
