import { BadGatewayException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SiteKind, UpstreamConfig } from '../../config/configuration';
import { joinUrl } from '../../common/http';

const LOGIN: Record<Exclude<SiteKind, 'rtg'>, { path: string; userKey: 'username' | 'login' }> = {
  trt: { path: '/auth/login', userKey: 'username' },
  gpg: { path: '/auth/login', userKey: 'login' },
  valesco: { path: '/auth/login', userKey: 'username' },
  winner: { path: '/api/auth/login', userKey: 'username' },
};

@Injectable()
export class UpstreamClient {
  private readonly tokens = new Map<string, string>();

  constructor(private readonly config: ConfigService) {}

  secret(slug: string): UpstreamConfig {
    const upstreams = this.config.get<Record<string, UpstreamConfig>>('upstreams');
    const site = upstreams?.[slug];
    if (!site) throw new NotFoundException('Sayt sozlamasi topilmadi');
    return site;
  }

  configured(site: UpstreamConfig): boolean {
    return site.kind === 'rtg' || Boolean(site.username && site.password);
  }

  async send(site: UpstreamConfig, path: string, init: { method?: string; json?: unknown; form?: FormData } = {}): Promise<unknown> {
    if (site.kind === 'rtg') {
      throw new ServiceUnavailableException('RTG katalogi shu platformada saqlanadi');
    }
    if (!site.username || !site.password) {
      throw new ServiceUnavailableException(`${site.name} upstream logini .env da yo‘q`);
    }
    return this.call(site, path, init, true);
  }

  private async call(
    site: UpstreamConfig,
    path: string,
    init: { method?: string; json?: unknown; form?: FormData },
    retry: boolean,
  ): Promise<unknown> {
    const token = await this.tokenFor(site);
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    let body: BodyInit | undefined;
    if (init.form) {
      body = init.form;
    } else if (init.json !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(init.json);
    }

    const response = await fetchKeepingMethod(joinUrl(site.baseUrl, path), {
      method: init.method ?? 'GET',
      headers,
      body,
    });

    if (response.status === 401 && retry) {
      this.tokens.delete(site.slug);
      return this.call(site, path, init, false);
    }

    return this.read(response);
  }

  private async tokenFor(site: UpstreamConfig): Promise<string> {
    const cached = this.tokens.get(site.slug);
    if (cached) return cached;
    if (site.kind === 'rtg') throw new ServiceUnavailableException('RTG upstream token ishlatilmaydi');
    const spec = LOGIN[site.kind];
    const response = await fetchKeepingMethod(joinUrl(site.baseUrl, spec.path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ [spec.userKey]: site.username, password: site.password }),
    });
    if (response.status === 401 || response.status === 403) {
      throw new BadGatewayException(`${site.name} logini rad etildi. .env dagi login va parolni tekshiring.`);
    }
    const payload = await this.read(response);
    const token = readToken(payload);
    if (!token) throw new BadGatewayException(`${site.name} token qaytarmadi`);
    this.tokens.set(site.slug, token);
    return token;
  }

  private async read(response: Response): Promise<unknown> {
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }
    if (response.ok) return payload;
    const message = messageOf(payload) ?? `Upstream ${response.status}`;
    throw new BadGatewayException(message.slice(0, 300));
  }
}

async function fetchKeepingMethod(url: string, init: RequestInit, hops = 0): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
    signal: AbortSignal.timeout(20000),
  });
  if (hops >= 3 || ![301, 302, 307, 308].includes(response.status)) return response;
  const location = response.headers.get('location');
  if (!location) return response;
  return fetchKeepingMethod(new URL(location, url).toString(), init, hops + 1);
}

function readToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  for (const key of ['accessToken', 'access_token', 'token']) {
    if (typeof record[key] === 'string' && record[key]) return record[key] as string;
  }
  return null;
}

function messageOf(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) return message.map(String).join(', ');
  if (typeof message === 'string') return message;
  return null;
}
