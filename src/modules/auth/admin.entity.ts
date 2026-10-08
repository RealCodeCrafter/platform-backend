import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AdminRole } from '../../common/enums';
import { Site } from '../sites/site.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: AdminRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  failedLogins: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @ManyToOne(() => Site, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'site_id' })
  site: Site | null;

  @CreateDateColumn()
  createdAt: Date;
}
