import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'The age of the Cat' })
  @Column({ nullable: true})
  name: string;

  @Column()
  description: string;

}
