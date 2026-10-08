import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const config = app.get(ConfigService);
  const nodeEnv = config.getOrThrow<string>('nodeEnv');

  if (nodeEnv === 'production') {
    const logger = new Logger('Bootstrap');
    for (const key of ['jwt.accessSecret', 'jwt.refreshSecret'] as const) {
      const secret = config.get<string>(key) ?? '';
      if (secret.includes('change-me') || secret.length < 32) {
        logger.warn(`${key} production uchun almashtirilishi kerak.`);
      }
    }
  }

  app.setGlobalPrefix('api');
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production',
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(compression());
  app.use(cookieParser());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.enableCors({
    origin: config.getOrThrow<string[]>('corsOrigins'),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Site-Slug'],
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('Platform admin API')
    .setDescription('Bitta login. Har bir admin faqat o‘z saytining katalogini ko‘radi va o‘zgartiradi.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build());
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.getOrThrow<number>('port'), '0.0.0.0');
}

void bootstrap();
