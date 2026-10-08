import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminRole } from './enums';

export function resolveSiteSlug(role: AdminRole, ownSlug: string | null, requested?: string): string {
  if (role !== AdminRole.SUPER_ADMIN) {
    if (!ownSlug) {
      throw new ForbiddenException('Bu admin hech qaysi saytga biriktirilmagan');
    }
    return ownSlug;
  }

  const slug = requested?.trim();
  if (!slug) {
    throw new BadRequestException('Super admin saytni tanlashi kerak');
  }
  return slug;
}
