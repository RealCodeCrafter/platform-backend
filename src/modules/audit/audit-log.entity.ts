import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  adminId: number;

  @Column()
  username: string;

  @Column()
  siteSlug: string;

  @Column()
  action: string;

  @Column({ type: 'varchar', nullable: true })
  resourceId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
