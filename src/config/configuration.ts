export type SiteKind = 'trt' | 'gpg' | 'valesco' | 'winner' | 'rtg';

export type UpstreamConfig = {
  slug: string;
  name: string;
  kind: SiteKind;
  baseUrl: string;
  username: string;
  password: string;
};

function upstream(
  env: NodeJS.ProcessEnv,
  slug: string,
  name: string,
  kind: SiteKind,
  urlKey: string,
  userKey: string,
  passKey: string,
): UpstreamConfig {
  return {
    slug,
    name,
    kind,
    baseUrl: (env[urlKey] ?? '').trim().replace(/\/$/, ''),
    username: (env[userKey] ?? '').trim(),
    password: env[passKey] ?? '',
  };
}

function fromConnectionUrl(raw: string, synchronize: boolean, source: string) {
  const parsed = new URL(raw.trim().replace(/^["']|["']$/g, ''));
  const host = parsed.hostname;
  const internal = host.endsWith('.internal');
  return {
    host,
    port: parseInt(parsed.port || '5432', 10),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    synchronize,
    ssl: !internal,
    source,
  };
}

function databaseSettings(env: NodeJS.ProcessEnv) {
  const synchronize = env.DB_SYNCHRONIZE !== 'false';
  const connectionUrl = env.DATABASE_URL?.trim() || env.DATABASE_PUBLIC_URL?.trim();
  if (connectionUrl?.includes('://')) {
    return fromConnectionUrl(connectionUrl, synchronize, env.DATABASE_URL?.trim() ? 'DATABASE_URL' : 'DATABASE_PUBLIC_URL');
  }

  if (env.PGHOST && env.PGUSER && env.PGPASSWORD) {
    const host = env.PGHOST;
    const internal = host.endsWith('.internal');
    return {
      host,
      port: parseInt(env.PGPORT || '5432', 10),
      username: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE || env.POSTGRES_DB || 'railway',
      synchronize,
      ssl: !internal,
      source: 'PGHOST',
    };
  }

  return {
    host: env.DB_HOST ?? 'localhost',
    port: parseInt(env.DB_PORT ?? '5433', 10),
    username: env.DB_USERNAME ?? 'postgres',
    password: env.DB_PASSWORD ?? 'postgres',
    database: env.DB_DATABASE ?? 'platform_admin',
    synchronize,
    ssl: env.DB_SSL === 'true',
    source: 'DB_HOST',
  };
}

export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  db: databaseSettings(process.env),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshDays: parseInt(process.env.JWT_REFRESH_DAYS ?? '7', 10),
  },
  seed: {
    enabled: process.env.SEED_ON_BOOT !== 'false',
    superUsername: process.env.SEED_SUPER_USERNAME ?? 'super',
    superPassword: process.env.SEED_SUPER_PASSWORD ?? 'SuperAdmin2026!',
    trtUsername: process.env.SEED_TRT_USERNAME ?? 'trt',
    trtPassword: process.env.SEED_TRT_PASSWORD ?? 'TrtAdmin2026!',
    gpgUsername: process.env.SEED_GPG_USERNAME ?? 'gpg',
    gpgPassword: process.env.SEED_GPG_PASSWORD ?? 'GpgAdmin2026!',
    valescoUsername: process.env.SEED_VALESCO_USERNAME ?? 'valesco',
    valescoPassword: process.env.SEED_VALESCO_PASSWORD ?? 'ValescoAdmin2026!',
    winnerUsername: process.env.SEED_WINNER_USERNAME ?? 'winner',
    winnerPassword: process.env.SEED_WINNER_PASSWORD ?? 'WinnerAdmin2026!',
    rtgUsername: process.env.SEED_RTG_USERNAME ?? 'rtg',
    rtgPassword: process.env.SEED_RTG_PASSWORD ?? 'RtgAdmin2026!',
  },
  upstreams: {
    trt: upstream(process.env, 'trt', 'TRT Parts', 'trt', 'TRT_BASE_URL', 'TRT_ADMIN_USERNAME', 'TRT_ADMIN_PASSWORD'),
    gpg: upstream(process.env, 'gpg', 'GPG Group', 'gpg', 'GPG_BASE_URL', 'GPG_ADMIN_USERNAME', 'GPG_ADMIN_PASSWORD'),
    valesco: upstream(process.env, 'valesco', 'Valesco Oil', 'valesco', 'VALESCO_BASE_URL', 'VALESCO_ADMIN_USERNAME', 'VALESCO_ADMIN_PASSWORD'),
    winner: upstream(process.env, 'winner', 'Winner Lub', 'winner', 'WINNER_BASE_URL', 'WINNER_ADMIN_USERNAME', 'WINNER_ADMIN_PASSWORD'),
    rtg: upstream(process.env, 'rtg', 'RTG Parts', 'rtg', 'RTG_BASE_URL', 'RTG_ADMIN_USERNAME', 'RTG_ADMIN_PASSWORD'),
  } satisfies Record<string, UpstreamConfig>,
});
