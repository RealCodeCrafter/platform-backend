import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Admin } from '../modules/auth/admin.entity';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentAdmin = createParamDecorator((_: unknown, ctx: ExecutionContext): Admin => {
  return ctx.switchToHttp().getRequest<{ user: Admin }>().user;
});

export const RequestedSite = createParamDecorator((_: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
  return request.headers['x-site-slug'];
});
