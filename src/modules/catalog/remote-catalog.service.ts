import { BadRequestException, Injectable } from '@nestjs/common';
import { UpstreamConfig } from '../../config/configuration';
import { asList, buildForm, stringList } from '../../common/http';
import { UpstreamClient } from '../upstream/upstream.client';
import { BrandInput, CategoryInput, NewsInput, ProductInput } from './dto';
import { mapBrand, mapCategory, mapNews, mapProduct } from './mappers';
import { BrandView, CategoryView, NewsView, ProductView } from './views';

@Injectable()
export class RemoteCatalogService {
  constructor(private readonly upstream: UpstreamClient) {}

  listCategories(site: UpstreamConfig): Promise<CategoryView[]> {
    return this.list(site, '/categories', (item) => mapCategory(site.kind, site.baseUrl, item));
  }

  listProducts(site: UpstreamConfig): Promise<ProductView[]> {
    const path = site.kind === 'trt' ? '/products/all' : '/products';
    return this.list(site, path, (item) => mapProduct(site.kind, site.baseUrl, item));
  }

  listBrands(site: UpstreamConfig): Promise<BrandView[]> {
    this.assertKind(site, 'gpg', 'Brendlar');
    return this.list(site, '/brands', (item) => mapBrand(site.baseUrl, item));
  }

  listNews(site: UpstreamConfig): Promise<NewsView[]> {
    this.assertKind(site, 'valesco', 'Yangiliklar');
    return this.list(site, '/news', (item) => mapNews(site.baseUrl, item));
  }

  async createCategory(site: UpstreamConfig, input: CategoryInput, files: Express.Multer.File[]): Promise<CategoryView> {
    const payload = await this.writeCategory(site, 'POST', '/categories', input, files);
    return mapCategory(site.kind, site.baseUrl, payload);
  }

  async updateCategory(site: UpstreamConfig, id: number, input: CategoryInput, files: Express.Multer.File[]): Promise<CategoryView> {
    const method = site.kind === 'valesco' ? 'PUT' : 'PATCH';
    const payload = await this.writeCategory(site, method, `/categories/${id}`, input, files);
    return mapCategory(site.kind, site.baseUrl, payload);
  }

  async deleteCategory(site: UpstreamConfig, id: number): Promise<{ ok: true }> {
    await this.upstream.send(site, this.route(site, `/categories/${id}`), { method: 'DELETE' });
    return { ok: true };
  }

  async createProduct(site: UpstreamConfig, input: ProductInput, files: Express.Multer.File[]): Promise<ProductView> {
    const payload = await this.writeProduct(site, site.kind === 'valesco' || site.kind === 'trt' ? 'POST' : 'POST', '/products', input, files);
    return mapProduct(site.kind, site.baseUrl, payload);
  }

  async updateProduct(site: UpstreamConfig, id: number, input: ProductInput, files: Express.Multer.File[]): Promise<ProductView> {
    const method = site.kind === 'gpg' || site.kind === 'winner' ? 'PATCH' : 'PUT';
    const payload = await this.writeProduct(site, method, `/products/${id}`, input, files);
    return mapProduct(site.kind, site.baseUrl, payload);
  }

  async deleteProduct(site: UpstreamConfig, id: number): Promise<{ ok: true }> {
    await this.upstream.send(site, this.route(site, `/products/${id}`), { method: 'DELETE' });
    return { ok: true };
  }

  async createBrand(site: UpstreamConfig, input: BrandInput): Promise<BrandView> {
    this.assertKind(site, 'gpg', 'Brendlar');
    const payload = await this.upstream.send(site, '/brands', { method: 'POST', json: input });
    return mapBrand(site.baseUrl, payload);
  }

  async updateBrand(site: UpstreamConfig, id: number, input: BrandInput): Promise<BrandView> {
    this.assertKind(site, 'gpg', 'Brendlar');
    const payload = await this.upstream.send(site, `/brands/${id}`, { method: 'PATCH', json: input });
    return mapBrand(site.baseUrl, payload);
  }

  async deleteBrand(site: UpstreamConfig, id: number): Promise<{ ok: true }> {
    this.assertKind(site, 'gpg', 'Brendlar');
    await this.upstream.send(site, `/brands/${id}`, { method: 'DELETE' });
    return { ok: true };
  }

  async createNews(site: UpstreamConfig, input: NewsInput): Promise<NewsView> {
    this.assertKind(site, 'valesco', 'Yangiliklar');
    const payload = await this.upstream.send(site, '/news', { method: 'POST', json: input });
    return mapNews(site.baseUrl, payload);
  }

  async updateNews(site: UpstreamConfig, id: number, input: NewsInput): Promise<NewsView> {
    this.assertKind(site, 'valesco', 'Yangiliklar');
    const payload = await this.upstream.send(site, `/news/${id}`, { method: 'PUT', json: input });
    return mapNews(site.baseUrl, payload);
  }

  async deleteNews(site: UpstreamConfig, id: number): Promise<{ ok: true }> {
    this.assertKind(site, 'valesco', 'Yangiliklar');
    await this.upstream.send(site, `/news/${id}`, { method: 'DELETE' });
    return { ok: true };
  }

  private async list<T>(site: UpstreamConfig, path: string, map: (item: unknown) => T): Promise<T[]> {
    const payload = await this.upstream.send(site, this.route(site, path));
    return asList(payload).map(map);
  }

  private route(site: UpstreamConfig, path: string): string {
    return site.kind === 'winner' ? `/api${path}` : path;
  }

  private assertKind(site: UpstreamConfig, kind: string, label: string): void {
    if (site.kind !== kind) throw new BadRequestException(`${site.name} da ${label.toLowerCase()} bo‘limi yo‘q`);
  }

  private writeCategory(site: UpstreamConfig, method: string, path: string, input: CategoryInput, files: Express.Multer.File[]) {
    if (site.kind === 'winner') {
      return this.upstream.send(site, this.route(site, path), {
        method,
        form: buildForm({
          title_ru: input.nameRu,
          title_en: input.nameEn ?? '',
          sortOrder: input.sortOrder ?? 0,
        }, files, 'images'),
      });
    }
    if (site.kind === 'gpg') {
      const json = {
        nameRu: input.nameRu,
        nameEn: input.nameEn,
        descriptionRu: input.descriptionRu,
        descriptionEn: input.descriptionEn,
      };
      if (!files.length) return this.upstream.send(site, path, { method, json });
      return this.upstream.send(site, path, { method, form: buildForm(json, files, 'images') });
    }
    if (site.kind === 'trt') {
      const translations = JSON.stringify({
        ru: { name: input.nameRu, description: input.descriptionRu ?? '' },
        en: { name: input.nameEn ?? '', description: input.descriptionEn ?? '' },
      });
      return this.upstream.send(site, path, { method, form: buildForm({ translations }, files, 'images') });
    }
    const json = { title_ru: input.nameRu, title_en: input.nameEn ?? '' };
    if (!files.length) return this.upstream.send(site, path, { method, json });
    return this.upstream.send(site, path, { method, form: buildForm(json, files, 'img') });
  }

  private writeProduct(site: UpstreamConfig, method: string, path: string, input: ProductInput, files: Express.Multer.File[]) {
    if (site.kind === 'winner') {
      return this.upstream.send(site, this.route(site, path), {
        method,
        form: buildForm({
          name_ru: input.nameRu,
          name_en: input.nameEn ?? '',
          description_ru: input.descriptionRu,
          description_en: input.descriptionEn,
          categoryId: input.categoryId,
          sortOrder: input.sortOrder,
          volumes: stringList(input.volumes).join(', '),
          ...specFields(input.specs),
        }, files, 'images'),
      });
    }
    if (site.kind === 'trt') {
      const json = {
        sku: input.sku,
        trtCode: input.code,
        brand: input.brandName,
        translations: {
          ru: { name: input.nameRu },
          en: { name: input.nameEn ?? '' },
        },
        oem: stringList(input.oem),
        carName: stringList(input.carName),
        model: stringList(input.model),
        years: stringList(input.years),
        categories: input.categoryId ? [input.categoryId] : [],
      };
      if (!files.length) return this.upstream.send(site, path, { method, json });
      return this.upstream.send(site, path, {
        method,
        form: buildForm({
          sku: json.sku,
          trtCode: json.trtCode,
          brand: json.brand,
          translations: JSON.stringify(json.translations),
          oem: JSON.stringify(json.oem),
          carName: JSON.stringify(json.carName),
          model: JSON.stringify(json.model),
          years: JSON.stringify(json.years),
          categories: JSON.stringify(json.categories),
        }, files, 'images'),
      });
    }
    if (site.kind === 'gpg') {
      const json = {
        nameRu: input.nameRu,
        nameEn: input.nameEn,
        descriptionRu: input.descriptionRu,
        descriptionEn: input.descriptionEn,
        brandId: input.brandId,
        ...input.specs,
      };
      if (!files.length) return this.upstream.send(site, path, { method, json });
      return this.upstream.send(site, path, { method, form: buildForm(flatten(json), files, 'images') });
    }
    const json = {
      title: input.nameRu,
      description_ru: input.descriptionRu,
      description_en: input.descriptionEn,
      categoryId: input.categoryId,
      sortOrder: input.sortOrder,
      ...input.specs,
    };
    if (!files.length) return this.upstream.send(site, path, { method, json });
    return this.upstream.send(site, path, { method, form: buildForm(flatten(json), files, 'image') });
  }
}

function specFields(specs?: Record<string, string[]>): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(specs ?? {})) {
    if (value.length) fields[key] = JSON.stringify(value);
  }
  return fields;
}

function flatten(input: Record<string, unknown>): Record<string, string | number | undefined> {
  const fields: Record<string, string | number | undefined> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) fields[key] = JSON.stringify(value);
    else if (typeof value === 'number' || typeof value === 'string') fields[key] = value;
  }
  return fields;
}
