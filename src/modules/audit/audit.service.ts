import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>) {}

  record(entry: { adminId: number; username: string; siteSlug: string; action: string; resourceId?: string | number | null }) {
    return this.logs.save(this.logs.create({
      adminId: entry.adminId,
      username: entry.username,
      siteSlug: entry.siteSlug,
      action: entry.action,
      resourceId: entry.resourceId == null ? null : String(entry.resourceId),
    }));
  }
}
