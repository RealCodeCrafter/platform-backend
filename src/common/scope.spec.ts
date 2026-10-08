import { AdminRole } from './enums';
import { resolveSiteSlug } from './scope';

describe('resolveSiteSlug', () => {
  it('locks a site admin to their own site', () => {
    expect(resolveSiteSlug(AdminRole.SITE_ADMIN, 'trt', 'gpg')).toBe('trt');
  });

  it('rejects a site admin without a site', () => {
    expect(() => resolveSiteSlug(AdminRole.SITE_ADMIN, null, 'trt')).toThrow('biriktirilmagan');
  });

  it('lets a super admin choose a site', () => {
    expect(resolveSiteSlug(AdminRole.SUPER_ADMIN, null, 'winner')).toBe('winner');
  });

  it('requires a super admin to choose a site', () => {
    expect(() => resolveSiteSlug(AdminRole.SUPER_ADMIN, null, '  ')).toThrow('tanlashi');
  });
});
