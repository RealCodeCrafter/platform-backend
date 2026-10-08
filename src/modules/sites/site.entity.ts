import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SiteKind } from '../../config/configuration';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  kind: SiteKind;

  @Column()
  baseUrl: string;

  @Column({ default: true })
  isActive: boolean;
}
