import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';

@Entity('category_rules')
@Index(['user_id'])
@Index(['priority'])
export class CategoryRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  pattern: string;

  @Column({ type: 'int' })
  category_id: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  match_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
