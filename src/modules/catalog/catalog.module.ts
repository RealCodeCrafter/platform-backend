import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Site } from '../sites/site.entity';
import { UpstreamModule } from '../upstream/upstream.module';
import { BrandsController, CatalogMetaController, CategoriesController, NewsController, ProductsController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { LocalCatalogService } from './local-catalog.service';
import { LocalCategory, LocalProduct } from './local.entities';
import { RemoteCatalogService } from './remote-catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([Site, LocalCategory, LocalProduct]), UpstreamModule, AuditModule],
  controllers: [CatalogMetaController, CategoriesController, ProductsController, BrandsController, NewsController],
  providers: [CatalogService, RemoteCatalogService, LocalCatalogService],
})
export class CatalogModule {}
