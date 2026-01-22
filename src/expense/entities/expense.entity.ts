import { Column, Entity, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

@Entity('expenses')
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

  @DeleteDateColumn()
  deleted_at?: Date;
}
