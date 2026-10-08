import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function typeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  const password = config.get<string>('db.password') ?? '';
  const host = config.getOrThrow<string>('db.host');
  new Logger('Database').log(
    `Connecting ${config.get('db.username')}@${host}:${config.get('db.port')}/${config.get('db.database')} via ${config.get('db.source')} ssl=${config.get('db.ssl')} passwordLength=${password.length}`,
  );
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('db.host'),
    port: config.getOrThrow<number>('db.port'),
    username: config.getOrThrow<string>('db.username'),
    password: config.get<string>('db.password') ?? '',
    database: config.getOrThrow<string>('db.database'),
    autoLoadEntities: true,
    synchronize: config.get<boolean>('db.synchronize') === true,
    ssl: config.get<boolean>('db.ssl') === true ? { rejectUnauthorized: false } : false,
    logging: false,
  };
}
