import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../auth/admin.entity';
import { Site } from '../sites/site.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Site])],
  providers: [SeedService],
})
export class SeedModule {}
