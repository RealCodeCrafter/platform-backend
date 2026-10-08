import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('local_categories')
export class LocalCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  siteId: number;

  @Column()
  nameRu: string;

  @Column({ default: '' })
  nameEn: string;

  @Column({ type: 'text', default: '' })
  descriptionRu: string;

  @Column({ type: 'text', default: '' })
  descriptionEn: string;

  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: 0 })
  sortOrder: number;
}

@Entity('local_products')
export class LocalProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  siteId: number;

  @Column()
  nameRu: string;

  @Column({ default: '' })
  nameEn: string;

  @Column({ type: 'text', default: '' })
  descriptionRu: string;

  @Column({ type: 'text', default: '' })
  descriptionEn: string;

  @Column({ type: 'text', default: '' })
  images: string;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', default: {} })
  specs: Record<string, string[]>;
}
