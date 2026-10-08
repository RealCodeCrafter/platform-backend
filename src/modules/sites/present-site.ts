import { Site } from './site.entity';
import { modulesFor } from '../catalog/schema';

export function presentSite(site: Site, upstreamConfigured: boolean) {
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    kind: site.kind,
    baseUrl: site.baseUrl,
    modules: modulesFor(site.kind),
    upstreamConfigured,
  };
}
