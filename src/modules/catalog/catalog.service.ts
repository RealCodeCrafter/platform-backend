import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpstreamConfig } from '../../config/configuration';
import { resolveSiteSlug } from '../../common/scope';
import { Admin } from '../auth/admin.entity';
import { AuditService } from '../audit/audit.service';
import { Site } from '../sites/site.entity';
import { presentSite } from '../sites/present-site';
import { UpstreamClient } from '../upstream/upstream.client';
import { BrandInput, CategoryInput, NewsInput, ProductInput } from './dto';
import { LocalCatalogService } from './local-catalog.service';
import { RemoteCatalogService } from './remote-catalog.service';
import { catalogSchema, requiredValue } from './schema';

type ActingSite = UpstreamConfig & { id: number };

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Site) private readonly sites: Repository<Site>,
    private readonly upstream: UpstreamClient,
    private readonly remote: RemoteCatalogService,
    private readonly local: LocalCatalogService,
    private readonly audit: AuditService,
  ) {}

  async schema(actor: Admin, requested?: string) {
    const site = await this.act(actor, requested);
    return { site: await this.publicSite(site), ...catalogSchema(site.kind) };
  }

  async overview(actor: Admin, requested?: string) {
    const site = await this.act(actor, requested);
    const schema = catalogSchema(site.kind);
    const configured = this.upstream.configured(site);
    const counts: Record<string, number | null> = { categories: null, products: null, brands: null, news: null };
    if (!configured) {
      return {
        site: await this.publicSite(site),
        modules: schema.modules,
        counts,
        warning: `${site.name} upstream logini .env da yo‘q. Panel login ishlaydi, katalog esa login qo‘yilgach ochiladi.`,
      };
    }

    try {
      if (schema.modules.includes('categories')) counts.categories = (await this.categories(actor, requested)).length;
      if (schema.modules.includes('products')) counts.products = (await this.products(actor, requested)).length;
      if (schema.modules.includes('brands')) counts.brands = (await this.brands(actor, requested)).length;
      if (schema.modules.includes('news')) counts.news = (await this.news(actor, requested)).length;
      return { site: await this.publicSite(site), modules: schema.modules, counts, warning: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upstream bilan aloqa yo‘q';
      return { site: await this.publicSite(site), modules: schema.modules, counts, warning: message };
    }
  }

  async categories(actor: Admin, requested?: string) {
    const site = await this.act(actor, requested);
    return site.kind === 'rtg' ? this.local.listCategories(site.id) : this.remote.listCategories(site);
  }

  async createCategory(actor: Admin, requested: string | undefined, input: CategoryInput, files: Express.Multer.File[]) {
    const site = await this.prepare(actor, requested, 'category', input, files, true);
    const saved = site.kind === 'rtg'
      ? await this.local.createCategory(site.id, input, files)
      : await this.remote.createCategory(site, input, files);
    await this.trail(actor, site, 'category.create', saved.id);
    return saved;
  }

  async updateCategory(actor: Admin, requested: string | undefined, id: number, input: CategoryInput, files: Express.Multer.File[]) {
    const site = await this.prepare(actor, requested, 'category', input, files, false);
    const saved = site.kind === 'rtg'
      ? await this.local.updateCategory(site.id, id, input, files)
      : await this.remote.updateCategory(site, id, input, files);
    await this.trail(actor, site, 'category.update', id);
    return saved;
  }

  async deleteCategory(actor: Admin, requested: string | undefined, id: number) {
    const site = await this.act(actor, requested);
    const result = site.kind === 'rtg' ? await this.local.deleteCategory(site.id, id) : await this.remote.deleteCategory(site, id);
    await this.trail(actor, site, 'category.delete', id);
    return result;
  }

  async products(actor: Admin, requested?: string) {
    const site = await this.act(actor, requested);
    return site.kind === 'rtg' ? this.local.listProducts(site.id) : this.remote.listProducts(site);
  }

  async createProduct(actor: Admin, requested: string | undefined, input: ProductInput, files: Express.Multer.File[]) {
    const site = await this.prepare(actor, requested, 'product', input, files, true);
    const saved = site.kind === 'rtg'
      ? await this.local.createProduct(site.id, input, files)
      : await this.remote.createProduct(site, input, files);
    await this.trail(actor, site, 'product.create', saved.id);
    return saved;
  }

  async updateProduct(actor: Admin, requested: string | undefined, id: number, input: ProductInput, files: Express.Multer.File[]) {
    const site = await this.prepare(actor, requested, 'product', input, files, false);
    const saved = site.kind === 'rtg'
      ? await this.local.updateProduct(site.id, id, input, files)
      : await this.remote.updateProduct(site, id, input, files);
    await this.trail(actor, site, 'product.update', id);
    return saved;
  }

  async deleteProduct(actor: Admin, requested: string | undefined, id: number) {
    const site = await this.act(actor, requested);
    const result = site.kind === 'rtg' ? await this.local.deleteProduct(site.id, id) : await this.remote.deleteProduct(site, id);
    await this.trail(actor, site, 'product.delete', id);
    return result;
  }

  async brands(actor: Admin, requested?: string) {
    const site = await this.act(actor, requested);
    return this.remote.listBrands(site);
  }

  async createBrand(actor: Admin, requested: string | undefined, input: BrandInput) {
    const site = await this.prepare(actor, requested, 'brand', input, [], false);
    const saved = await this.remote.createBrand(site, input);
    await this.trail(actor, site, 'brand.create', saved.id);
    return saved;
  }

  async updateBrand(actor: Admin, requested: string | undefined, id: number, input: BrandInput) {
    const site = await this.prepare(actor, requested, 'brand', input, [], false);
    const saved = await this.remote.updateBrand(site, id, input);
    await this.trail(actor, site, 'brand.update', id);
    return saved;
  }

  async deleteBrand(actor: Admin, requested: string | undefined, id: number) {
    const site = await this.act(actor, requested);
    const result = await this.remote.deleteBrand(site, id);
    await this.trail(actor, site, 'brand.delete', id);
    return result;
  }

  async news(actor: Admin, requested?: string) {
    const site = await this.act(actor, requested);
    return this.remote.listNews(site);
  }

  async createNews(actor: Admin, requested: string | undefined, input: NewsInput) {
    const site = await this.prepare(actor, requested, 'news', input, [], false);
    const saved = await this.remote.createNews(site, input);
    await this.trail(actor, site, 'news.create', saved.id);
    return saved;
  }

  async updateNews(actor: Admin, requested: string | undefined, id: number, input: NewsInput) {
    const site = await this.prepare(actor, requested, 'news', input, [], false);
    const saved = await this.remote.updateNews(site, id, input);
    await this.trail(actor, site, 'news.update', id);
    return saved;
  }

  async deleteNews(actor: Admin, requested: string | undefined, id: number) {
    const site = await this.act(actor, requested);
    const result = await this.remote.deleteNews(site, id);
    await this.trail(actor, site, 'news.delete', id);
    return result;
  }

  private async prepare(
    actor: Admin,
    requested: string | undefined,
    section: 'category' | 'product' | 'brand' | 'news',
    input: object,
    files: Express.Multer.File[],
    creating: boolean,
  ): Promise<ActingSite> {
    const site = await this.act(actor, requested);
    const schema = catalogSchema(site.kind);
    if (section === 'brand' && !schema.modules.includes('brands')) {
      throw new BadRequestException(`${site.name} da brend bo‘limi yo‘q`);
    }
    if (section === 'news' && !schema.modules.includes('news')) {
      throw new BadRequestException(`${site.name} da yangilik bo‘limi yo‘q`);
    }
    for (const item of schema[section]) {
      if (!item.required) continue;
      const value = requiredValue(input as Record<string, unknown>, item.key);
      const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) throw new BadRequestException(`${item.label} to‘ldirilishi shart`);
    }
    if (creating && schema.imageRequired && (section === 'category' || section === 'product') && files.length === 0) {
      throw new BadRequestException('Bu saytga kamida bitta rasm yuklash shart');
    }
    return site;
  }

  private async act(actor: Admin, requested?: string): Promise<ActingSite> {
    const slug = resolveSiteSlug(actor.role, actor.site?.slug ?? null, requested);
    const site = await this.sites.findOne({ where: { slug, isActive: true } });
    if (!site) throw new NotFoundException('Sayt topilmadi');
    const secret = this.upstream.secret(slug);
    return {
      id: site.id,
      slug: site.slug,
      name: site.name,
      kind: site.kind,
      baseUrl: secret.baseUrl || site.baseUrl,
      username: secret.username,
      password: secret.password,
    };
  }

  private async publicSite(site: ActingSite) {
    const row = await this.sites.findOne({ where: { id: site.id } });
    if (!row) throw new NotFoundException('Sayt topilmadi');
    return presentSite({ ...row, baseUrl: site.baseUrl }, this.upstream.configured(site));
  }

  private trail(actor: Admin, site: ActingSite, action: string, resourceId: number) {
    return this.audit.record({ adminId: actor.id, username: actor.username, siteSlug: site.slug, action, resourceId });
  }
}
