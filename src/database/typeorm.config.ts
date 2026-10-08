import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function typeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('db.host'),
    port: config.getOrThrow<number>('db.port'),
    username: config.getOrThrow<string>('db.username'),
    password: config.get<string>('db.password') ?? '',
    database: config.getOrThrow<string>('db.database'),
    autoLoadEntities: true,
    synchronize: config.get<boolean>('db.synchronize') === true && config.get<string>('nodeEnv') !== 'production',
    logging: false,
  };
}
