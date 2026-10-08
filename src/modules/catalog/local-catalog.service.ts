import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { stringList } from '../../common/http';
import { CategoryInput, ProductInput } from './dto';
import { LocalCategory, LocalProduct } from './local.entities';
import { CategoryView, ProductView } from './views';

@Injectable()
export class LocalCatalogService {
  constructor(
    @InjectRepository(LocalCategory) private readonly categories: Repository<LocalCategory>,
    @InjectRepository(LocalProduct) private readonly products: Repository<LocalProduct>,
  ) {}

  async listCategories(siteId: number): Promise<CategoryView[]> {
    const rows = await this.categories.find({ where: { siteId }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.map((row) => this.categoryView(row));
  }

  async createCategory(siteId: number, input: CategoryInput, files: Express.Multer.File[]): Promise<CategoryView> {
    const images = await this.saveFiles(files);
    const saved = await this.categories.save(this.categories.create({
      siteId,
      nameRu: input.nameRu,
      nameEn: input.nameEn ?? '',
      descriptionRu: input.descriptionRu ?? '',
      descriptionEn: input.descriptionEn ?? '',
      image: images[0] ?? null,
      sortOrder: input.sortOrder ?? 0,
    }));
    return this.categoryView(saved);
  }

  async updateCategory(siteId: number, id: number, input: CategoryInput, files: Express.Multer.File[]): Promise<CategoryView> {
    const row = await this.requireCategory(siteId, id);
    const images = await this.saveFiles(files);
    Object.assign(row, {
      nameRu: input.nameRu,
      nameEn: input.nameEn ?? '',
      descriptionRu: input.descriptionRu ?? '',
      descriptionEn: input.descriptionEn ?? '',
      sortOrder: input.sortOrder ?? row.sortOrder,
      image: images[0] ?? row.image,
    });
    return this.categoryView(await this.categories.save(row));
  }

  async deleteCategory(siteId: number, id: number): Promise<{ ok: true }> {
    const row = await this.requireCategory(siteId, id);
    await this.categories.remove(row);
    return { ok: true };
  }

  async listProducts(siteId: number): Promise<ProductView[]> {
    const rows = await this.products.find({ where: { siteId }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.map((row) => this.productView(row));
  }

  async createProduct(siteId: number, input: ProductInput, files: Express.Multer.File[]): Promise<ProductView> {
    const images = await this.saveFiles(files);
    const saved = await this.products.save(this.products.create(this.productRow(siteId, input, images.join('\n'))));
    return this.productView(saved);
  }

  async updateProduct(siteId: number, id: number, input: ProductInput, files: Express.Multer.File[]): Promise<ProductView> {
    const row = await this.requireProduct(siteId, id);
    const images = await this.saveFiles(files);
    Object.assign(row, this.productRow(siteId, input, images.length ? images.join('\n') : row.images));
    return this.productView(await this.products.save(row));
  }

  async deleteProduct(siteId: number, id: number): Promise<{ ok: true }> {
    const row = await this.requireProduct(siteId, id);
    await this.products.remove(row);
    return { ok: true };
  }

  private async requireCategory(siteId: number, id: number): Promise<LocalCategory> {
    const row = await this.categories.findOne({ where: { id, siteId } });
    if (!row) throw new NotFoundException('Kategoriya topilmadi');
    return row;
  }

  private async requireProduct(siteId: number, id: number): Promise<LocalProduct> {
    const row = await this.products.findOne({ where: { id, siteId } });
    if (!row) throw new NotFoundException('Mahsulot topilmadi');
    return row;
  }

  private categoryView(row: LocalCategory): CategoryView {
    return {
      id: row.id,
      nameRu: row.nameRu,
      nameEn: row.nameEn,
      descriptionRu: row.descriptionRu,
      descriptionEn: row.descriptionEn,
      image: row.image,
      sortOrder: row.sortOrder,
    };
  }

  private productView(row: LocalProduct): ProductView {
    return {
      id: row.id,
      nameRu: row.nameRu,
      nameEn: row.nameEn,
      descriptionRu: row.descriptionRu,
      descriptionEn: row.descriptionEn,
      images: stringList(row.images),
      categoryId: row.categoryId,
      brandId: null,
      sku: '',
      code: '',
      brandName: '',
      sortOrder: row.sortOrder,
      oem: '',
      carName: '',
      model: '',
      years: '',
      volumes: '',
      specs: row.specs ?? {},
    };
  }

  private productRow(siteId: number, input: ProductInput, images: string): Partial<LocalProduct> {
    return {
      siteId,
      nameRu: input.nameRu,
      nameEn: input.nameEn ?? '',
      descriptionRu: input.descriptionRu ?? '',
      descriptionEn: input.descriptionEn ?? '',
      images,
      categoryId: input.categoryId ?? null,
      sortOrder: input.sortOrder ?? 0,
      specs: input.specs ?? {},
    };
  }

  private async saveFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files.length) return [];
    const directory = join(process.cwd(), 'uploads', 'rtg');
    await mkdir(directory, { recursive: true });
    const urls: string[] = [];
    for (const file of files) {
      const extension = extname(file.originalname || '').toLowerCase();
      const safe = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension) ? extension : '.jpg';
      const name = `${Date.now()}-${randomBytes(6).toString('hex')}${safe}`;
      await writeFile(join(directory, name), file.buffer);
      urls.push(`/uploads/rtg/${name}`);
    }
    return urls;
  }
}
