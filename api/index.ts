import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../apps/api/src/app.module';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: any;

async function bootstrap() {
  if (cachedApp) return cachedApp;
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });
  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}
