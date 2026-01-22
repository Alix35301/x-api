import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokens {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  token_hash: string;

  @Column()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  revoked_at: Date;

  @Column()
  device_name: string;

  @Column()
  ip_address: string;

  @Column()
  user_agent: string;

  @Column({ nullable: true })
  last_used_at: Date;
}
