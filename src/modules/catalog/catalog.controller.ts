import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin, RequestedSite } from '../../common/decorators';
import { imageUploadOptions } from '../../common/upload';
import { Admin } from '../auth/admin.entity';
import { CatalogService } from './catalog.service';
import { BrandBodyDto, CategoryBodyDto, NewsBodyDto, ProductBodyDto } from './dto';

@ApiTags('Catalog')
@ApiBearerAuth('access-token')
@Controller('catalog')
export class CatalogMetaController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('schema')
  schema(@CurrentAdmin() admin: Admin, @RequestedSite() site?: string) {
    return this.catalog.schema(admin, site);
  }

  @Get('overview')
  overview(@CurrentAdmin() admin: Admin, @RequestedSite() site?: string) {
    return this.catalog.overview(admin, site);
  }
}

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@CurrentAdmin() admin: Admin, @RequestedSite() site?: string) {
    return this.catalog.categories(admin, site);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 8, imageUploadOptions))
  create(
    @CurrentAdmin() admin: Admin,
    @RequestedSite() site: string | undefined,
    @Body() body: CategoryBodyDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.catalog.createCategory(admin, site, body, files ?? []);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 8, imageUploadOptions))
  update(
    @CurrentAdmin() admin: Admin,
    @RequestedSite() site: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CategoryBodyDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.catalog.updateCategory(admin, site, id, body, files ?? []);
  }

  @Delete(':id')
  remove(@CurrentAdmin() admin: Admin, @RequestedSite() site: string | undefined, @Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteCategory(admin, site, id);
  }
}

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@CurrentAdmin() admin: Admin, @RequestedSite() site?: string) {
    return this.catalog.products(admin, site);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 8, imageUploadOptions))
  create(
    @CurrentAdmin() admin: Admin,
    @RequestedSite() site: string | undefined,
    @Body() body: ProductBodyDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.catalog.createProduct(admin, site, body, files ?? []);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 8, imageUploadOptions))
  update(
    @CurrentAdmin() admin: Admin,
    @RequestedSite() site: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ProductBodyDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.catalog.updateProduct(admin, site, id, body, files ?? []);
  }

  @Delete(':id')
  remove(@CurrentAdmin() admin: Admin, @RequestedSite() site: string | undefined, @Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteProduct(admin, site, id);
  }
}

@ApiTags('Brands')
@ApiBearerAuth('access-token')
@Controller('brands')
export class BrandsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@CurrentAdmin() admin: Admin, @RequestedSite() site?: string) {
    return this.catalog.brands(admin, site);
  }

  @Post()
  create(@CurrentAdmin() admin: Admin, @RequestedSite() site: string | undefined, @Body() body: BrandBodyDto) {
    return this.catalog.createBrand(admin, site, body);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: Admin,
    @RequestedSite() site: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: BrandBodyDto,
  ) {
    return this.catalog.updateBrand(admin, site, id, body);
  }

  @Delete(':id')
  remove(@CurrentAdmin() admin: Admin, @RequestedSite() site: string | undefined, @Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteBrand(admin, site, id);
  }
}

@ApiTags('News')
@ApiBearerAuth('access-token')
@Controller('news')
export class NewsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@CurrentAdmin() admin: Admin, @RequestedSite() site?: string) {
    return this.catalog.news(admin, site);
  }

  @Post()
  create(@CurrentAdmin() admin: Admin, @RequestedSite() site: string | undefined, @Body() body: NewsBodyDto) {
    return this.catalog.createNews(admin, site, body);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: Admin,
    @RequestedSite() site: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: NewsBodyDto,
  ) {
    return this.catalog.updateNews(admin, site, id, body);
  }

  @Delete(':id')
  remove(@CurrentAdmin() admin: Admin, @RequestedSite() site: string | undefined, @Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteNews(admin, site, id);
  }
}
